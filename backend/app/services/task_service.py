"""Database service helpers for task records."""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from sqlalchemy import Select, delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task


def parse_json_field(value: str | None, default: Any) -> Any:
    """Parse a JSON string field from the Task table."""
    if value is None:
        return default
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return default


def serialize_json(value: Any) -> str:
    """Serialize a value for Task text-backed JSON columns."""
    return json.dumps(value, default=str)


def task_to_summary(task: Task) -> dict[str, Any]:
    """Convert a Task model into a list-friendly response dict."""
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "task_type_hint": task.task_type_hint,
        "task_type": task.task_type,
        "status": task.status,
        "retry_count": task.retry_count,
        "cost_usd": task.cost_usd,
        "duration_ms": task.duration_ms,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "completed_at": task.completed_at,
    }


def task_to_detail(task: Task) -> dict[str, Any]:
    """Convert a Task model into a full response dict."""
    data = task_to_summary(task)
    data.update(
        {
            "final_output": parse_json_field(task.final_output, None),
            "execution_trace": parse_json_field(task.execution_trace, []),
            "validation_errors": parse_json_field(task.validation_errors, []),
            "confidence_scores": parse_json_field(task.confidence_scores, {}),
            "failure_reason": task.failure_reason,
            "has_file": task.has_file,
        }
    )
    return data


async def create_task(
    db: AsyncSession,
    *,
    user_id: str,
    title: str,
    description: str,
    task_type_hint: str = "auto",
    file_base64: str | None = None,
) -> Task:
    """Create and persist a pending task."""
    task = Task(
        user_id=user_id,
        title=title,
        description=description,
        task_type_hint=task_type_hint,
        status="pending",
        has_file=file_base64 is not None,
        file_content=file_base64,
    )
    db.add(task)
    await db.flush()
    await db.refresh(task)
    return task


async def get_task(db: AsyncSession, task_id: str, user_id: str) -> Task | None:
    """Fetch a user-owned task."""
    result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    return result.scalar_one_or_none()


def _apply_filters(
    query: Select[tuple[Task]],
    *,
    status: str | None,
    task_type: str | None,
    search: str | None,
) -> Select[tuple[Task]]:
    if status:
        query = query.where(Task.status == status)
    if task_type:
        query = query.where(Task.task_type == task_type)
    if search:
        pattern = f"%{search}%"
        query = query.where(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))
    return query


async def list_tasks(
    db: AsyncSession,
    *,
    user_id: str,
    status: str | None = None,
    task_type: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
) -> tuple[list[Task], int]:
    """Return paginated tasks and total count."""
    page = max(page, 1)
    limit = min(max(limit, 1), 100)
    base_query = select(Task).where(Task.user_id == user_id)
    filtered_query = _apply_filters(
        base_query,
        status=status,
        task_type=task_type,
        search=search,
    )
    count_query = select(func.count()).select_from(filtered_query.subquery())
    total = (await db.execute(count_query)).scalar_one()
    result = await db.execute(
        filtered_query.order_by(Task.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    return list(result.scalars().all()), total


async def delete_task(db: AsyncSession, task_id: str, user_id: str) -> bool:
    """Delete a user-owned task."""
    result = await db.execute(delete(Task).where(Task.id == task_id, Task.user_id == user_id))
    return bool(result.rowcount)


async def update_task_from_state(
    db: AsyncSession,
    task: Task,
    state: dict[str, Any],
    *,
    duration_ms: int | None = None,
) -> Task:
    """Persist graph state back to the Task row."""
    task.task_type = state.get("task_type")
    task.status = state.get("status", task.status)
    task.final_output = serialize_json(state.get("final_output"))
    task.execution_trace = serialize_json(state.get("logs", []))
    task.validation_errors = serialize_json(state.get("validation_errors", []))
    task.confidence_scores = serialize_json(state.get("confidence_scores", {}))
    task.failure_reason = state.get("error")
    task.retry_count = int(state.get("retry_count") or 0)
    task.cost_usd = float(state.get("cost_usd") or 0.0)
    task.duration_ms = duration_ms
    completed_at = state.get("completed_at")
    if isinstance(completed_at, datetime):
        task.completed_at = completed_at
    elif task.status in {"success", "failed", "escalated"}:
        task.completed_at = datetime.utcnow()
    await db.flush()
    await db.refresh(task)
    return task


async def update_task_status(
    db: AsyncSession,
    task: Task,
    status: str,
    failure_reason: str | None = None,
) -> Task:
    """Update task status and optional failure reason."""
    task.status = status
    task.failure_reason = failure_reason
    if status in {"success", "failed", "escalated"}:
        task.completed_at = datetime.utcnow()
    await db.flush()
    await db.refresh(task)
    return task


async def get_analytics(db: AsyncSession, user_id: str) -> dict[str, Any]:
    """Return simple aggregate task metrics for the dashboard."""
    result = await db.execute(select(Task).where(Task.user_id == user_id))
    tasks = list(result.scalars().all())
    total_tasks = len(tasks)
    success_count = len([task for task in tasks if task.status == "success"])
    completed_durations = [task.duration_ms for task in tasks if task.duration_ms is not None]
    total_cost = sum(task.cost_usd for task in tasks)

    by_status: dict[str, int] = {}
    by_type: dict[str, int] = {}
    for task in tasks:
        by_status[task.status] = by_status.get(task.status, 0) + 1
        key = task.task_type or "unclassified"
        by_type[key] = by_type.get(key, 0) + 1

    return {
        "total_tasks": total_tasks,
        "success_rate": success_count / total_tasks if total_tasks else 0.0,
        "avg_duration_ms": (
            sum(completed_durations) / len(completed_durations) if completed_durations else 0.0
        ),
        "total_cost_usd": total_cost,
        "by_status": by_status,
        "by_type": by_type,
        "recent_tasks": [task_to_summary(task) for task in tasks[:10]],
    }


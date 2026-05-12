"""Celery application and background pipeline task."""

from __future__ import annotations

import asyncio
from time import perf_counter
from typing import Any

from celery import Celery
from sqlalchemy import select

from app.agents.graph import compiled_graph
from app.agents.state import TaskState, utc_now
from app.config import settings
from app.database import AsyncSessionLocal
from app.models.task import Task
from app.models.user import User  # noqa: F401
from app.services.task_service import update_task_from_state, update_task_status

celery_app = Celery(
    "ai_automation_platform",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)


def _state_to_dict(result: Any) -> dict[str, Any]:
    """Normalize LangGraph output into a plain dict."""
    if isinstance(result, TaskState):
        return result.model_dump(mode="json")
    if isinstance(result, dict):
        return result
    raise TypeError(f"Unsupported graph result type: {type(result)!r}")


async def _run_pipeline_async(task_id: str, user_id: str) -> dict[str, Any]:
    started = perf_counter()
    async with AsyncSessionLocal() as db:
        task: Task | None = None
        try:
            result = await db.execute(
                select(Task).where(Task.id == task_id, Task.user_id == user_id)
            )
            task = result.scalar_one_or_none()
            if task is None:
                return {"status": "failed", "error": "Task not found"}

            await update_task_status(db, task, "running")
            await db.commit()

            initial_state = TaskState(
                task_id=task.id,
                user_id=task.user_id,
                raw_input=task.description,
                task_type_hint=task.task_type_hint,
                status="running",
                started_at=utc_now(),
            )

            graph_result = await compiled_graph.ainvoke(initial_state)
            state = _state_to_dict(graph_result)
            duration_ms = int((perf_counter() - started) * 1000)
            await update_task_from_state(db, task, state, duration_ms=duration_ms)
            await db.commit()
            return {"status": state.get("status"), "task_id": task.id}
        except Exception as exc:
            if task is not None:
                await update_task_status(db, task, "failed", failure_reason=str(exc))
                await db.commit()
            return {"status": "failed", "task_id": task_id, "error": str(exc)}


@celery_app.task(name="app.celery_app.run_pipeline")
def run_pipeline(task_id: str, user_id: str) -> dict[str, Any]:
    """Run the compiled LangGraph pipeline for a task."""
    return asyncio.run(_run_pipeline_async(task_id, user_id))

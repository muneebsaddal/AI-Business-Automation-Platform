"""Task CRUD and analytics endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.celery_app import run_pipeline
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.api_schemas import (
    AnalyticsResponse,
    RerunResponse,
    TaskDetailResponse,
    TaskListResponse,
    TaskSummaryResponse,
)
from app.services.task_service import (
    create_task,
    delete_task,
    get_analytics,
    get_task,
    list_tasks,
    task_to_detail,
    task_to_summary,
)

router = APIRouter(tags=["tasks"])


@router.get("/tasks", response_model=TaskListResponse)
async def list_user_tasks(
    status_filter: str | None = Query(default=None, alias="status"),
    task_type: str | None = None,
    search: str | None = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskListResponse:
    """Return paginated tasks for the current user."""
    tasks, total = await list_tasks(
        db,
        user_id=current_user.id,
        status=status_filter,
        task_type=task_type,
        search=search,
        page=page,
        limit=limit,
    )
    return TaskListResponse(
        items=[TaskSummaryResponse(**task_to_summary(task)) for task in tasks],
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/tasks/{task_id}", response_model=TaskDetailResponse)
async def get_user_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskDetailResponse:
    """Return full task detail for a user-owned task."""
    task = await get_task(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return TaskDetailResponse(**task_to_detail(task))


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete a user-owned task."""
    deleted = await delete_task(db, task_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")


@router.post(
    "/tasks/{task_id}/rerun",
    response_model=RerunResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def rerun_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> RerunResponse:
    """Create a new task from the original input and enqueue it."""
    original = await get_task(db, task_id, current_user.id)
    if original is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    new_task = await create_task(
        db,
        user_id=current_user.id,
        title=f"Rerun: {original.title}",
        description=original.description,
        task_type_hint=original.task_type_hint,
        file_base64=original.file_content,
    )
    await db.commit()
    run_pipeline.delay(new_task.id, current_user.id)
    return RerunResponse(
        task_id=new_task.id,
        status=new_task.status,
        ws_url=f"/ws/{new_task.id}",
    )


@router.get("/tasks/{task_id}/export")
async def export_task_trace(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """Export a task's execution trace as JSON."""
    task = await get_task(db, task_id, current_user.id)
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return JSONResponse(
        content=jsonable_encoder(task_to_detail(task)),
        headers={"Content-Disposition": f"attachment; filename={task.id}_trace.json"},
    )


@router.get("/analytics", response_model=AnalyticsResponse)
async def analytics(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AnalyticsResponse:
    """Return dashboard analytics for the current user."""
    return AnalyticsResponse(**await get_analytics(db, current_user.id))

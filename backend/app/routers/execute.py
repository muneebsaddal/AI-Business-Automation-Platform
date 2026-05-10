"""Task execution endpoint."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.celery_app import run_pipeline
from app.database import get_db
from app.middleware.auth import get_current_user
from app.models.user import User
from app.schemas.api_schemas import ExecuteRequest, ExecuteResponse
from app.services.task_service import create_task

router = APIRouter(tags=["execute"])


@router.post("/execute", response_model=ExecuteResponse, status_code=status.HTTP_202_ACCEPTED)
async def execute_task(
    body: ExecuteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExecuteResponse:
    """Create a task and enqueue the agent pipeline."""
    task = await create_task(
        db,
        user_id=current_user.id,
        title=body.title,
        description=body.description,
        task_type_hint=body.task_type_hint,
        file_base64=body.file_base64,
    )
    await db.commit()
    run_pipeline.delay(task.id, current_user.id)
    return ExecuteResponse(task_id=task.id, status=task.status, ws_url=f"/ws/{task.id}")


"""WebSocket endpoint for live task execution events."""

from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select

from app.database import AsyncSessionLocal
from app.middleware.auth import decode_token
from app.models.task import Task
from app.services.redis_client import subscribe_task_events
from app.services.task_service import task_to_detail

router = APIRouter(tags=["websocket"])

TERMINAL_STATUSES = {"success", "failed", "escalated"}


async def _close_policy_violation(websocket: WebSocket, reason: str) -> None:
    await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason=reason)


async def _get_user_id_from_token(token: str | None) -> str | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
    except Exception:
        return None
    if payload.get("type") != "access":
        return None
    return payload.get("sub")


async def _get_user_task(task_id: str, user_id: str) -> Task | None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Task).where(Task.id == task_id, Task.user_id == user_id))
        return result.scalar_one_or_none()


@router.websocket("/ws/{task_id}")
async def task_events_websocket(websocket: WebSocket, task_id: str) -> None:
    """Stream task execution events from Redis to the browser."""
    token = websocket.query_params.get("token")
    user_id = await _get_user_id_from_token(token)
    if not user_id:
        await _close_policy_violation(websocket, "Invalid or missing token")
        return

    task = await _get_user_task(task_id, user_id)
    if task is None:
        await _close_policy_violation(websocket, "Task not found")
        return

    await websocket.accept()

    if task.status in TERMINAL_STATUSES:
        await websocket.send_json(
            {
                "event": "complete",
                "status": task.status,
                "task": jsonable_encoder(task_to_detail(task)),
            }
        )
        await websocket.close()
        return

    try:
        async for event in subscribe_task_events(task_id):
            await websocket.send_json(event)
            if event.get("event") == "complete":
                await websocket.close()
                return
    except WebSocketDisconnect:
        return

"""Async Redis helpers for live task state and event streaming."""

from __future__ import annotations

import json
from asyncio import get_running_loop
from collections.abc import AsyncGenerator
from typing import Any

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.config import settings

_redis_by_loop: dict[int, Redis] = {}


async def get_redis() -> Redis:
    """Return a Redis connection bound to the current asyncio event loop."""
    loop_id = id(get_running_loop())
    redis = _redis_by_loop.get(loop_id)
    if redis is None:
        redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        _redis_by_loop[loop_id] = redis
    return redis


def _task_state_key(task_id: str) -> str:
    return f"task_state:{task_id}"


def _task_events_channel(task_id: str) -> str:
    return f"task_events:{task_id}"


async def set_task_state(task_id: str, state_dict: dict[str, Any], ttl: int = 3600) -> None:
    """Store a JSON-serializable task state snapshot with a TTL."""
    redis = await get_redis()
    await redis.set(_task_state_key(task_id), json.dumps(state_dict, default=str), ex=ttl)


async def get_task_state(task_id: str) -> dict[str, Any] | None:
    """Load a task state snapshot from Redis."""
    redis = await get_redis()
    raw = await redis.get(_task_state_key(task_id))
    if raw is None:
        return None
    return json.loads(raw)


async def publish_event(task_id: str, event_dict: dict[str, Any]) -> None:
    """Publish a JSON event to the task's live event channel."""
    redis = await get_redis()
    await redis.publish(_task_events_channel(task_id), json.dumps(event_dict, default=str))


async def subscribe_task_events(task_id: str) -> AsyncGenerator[dict[str, Any], None]:
    """Yield decoded events from a task's Redis pub/sub channel."""
    redis = await get_redis()
    pubsub = redis.pubsub()
    channel = _task_events_channel(task_id)
    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            data = message.get("data")
            if not data:
                continue
            yield json.loads(data)
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.close()


async def ping() -> bool:
    """Return True when Redis is reachable."""
    try:
        redis = await get_redis()
        return bool(await redis.ping())
    except RedisError:
        return False

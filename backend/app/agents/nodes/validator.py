"""Validator node."""

from __future__ import annotations

from statistics import mean
from time import perf_counter
from typing import Any

from pydantic import ValidationError as PydanticValidationError

from app.agents.state import LogEntry, TaskState, ValidationError, utc_now
from app.schemas.task_schemas import TASK_OUTPUT_SCHEMA_BY_TASK_TYPE
from app.services.redis_client import publish_event


def _field_confidence(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, str):
        cleaned = value.strip().lower()
        if not cleaned or cleaned in {"unknown", "n/a", "none", "null"}:
            return 0.35
        return 0.85
    if isinstance(value, list):
        return 0.75 if value else 0.45
    if isinstance(value, bool):
        return 0.8
    if isinstance(value, int | float):
        return 0.85
    return 0.7


def _confidence_scores(output: dict[str, Any]) -> dict[str, float]:
    return {field: _field_confidence(value) for field, value in output.items()}


def route_after_validation(state: TaskState) -> str:
    """Choose the next graph edge after validation."""
    if state.status == "retried":
        return "retry"
    if state.status == "escalated":
        return "escalate"
    if state.status == "success":
        return "pass"
    return "fail"


async def validator(state: TaskState) -> TaskState:
    """Validate final output and decide pass, retry, escalate, or fail."""
    started = perf_counter()
    task_type = state.task_type or "custom"
    schema = TASK_OUTPUT_SCHEMA_BY_TASK_TYPE[task_type]
    log = LogEntry(
        agent="Validator",
        action="validate_final_output",
        input_snapshot={
            "task_type": task_type,
            "final_output": state.final_output,
            "step_results": [result.model_dump() for result in state.step_results],
        },
    )

    try:
        await publish_event(
            state.task_id,
            {
                "event": "node_start",
                "node": "Validator",
                "timestamp": utc_now().isoformat(),
            },
        )

        validated_output = schema.model_validate(state.final_output or {})
        state.final_output = validated_output.model_dump()
        state.validation_errors = []
        state.confidence_scores = _confidence_scores(state.final_output)
        avg_confidence = mean(state.confidence_scores.values()) if state.confidence_scores else 0.0

        if avg_confidence < 0.5:
            state.status = "escalated"
            state.error = "Average confidence is below escalation threshold"
            decision = "Escalated because confidence is too low"
        else:
            state.status = "success"
            state.error = None
            state.completed_at = utc_now()
            decision = "Final output is schema-valid and confidence is acceptable"

        entry = log.with_output(
            {
                "status": state.status,
                "final_output": state.final_output,
                "confidence_scores": state.confidence_scores,
                "avg_confidence": avg_confidence,
            },
            decision=decision,
            duration_ms=int((perf_counter() - started) * 1000),
        )
        state.logs.append(entry)
        await publish_event(
            state.task_id,
            {
                "event": "complete",
                "status": state.status,
                "output": state.final_output,
                "cost_usd": state.cost_usd,
                "duration_ms": entry.duration_ms,
            },
        )
        return state

    except PydanticValidationError as exc:
        state.validation_errors = []
        for error in exc.errors():
            field = ".".join(str(part) for part in error["loc"])
            validation_error = ValidationError(
                field=field,
                expected=error["type"],
                received=error.get("input"),
                reason=error["msg"],
            )
            state.validation_errors.append(validation_error)
            await publish_event(
                state.task_id,
                {
                    "event": "validation_error",
                    "field": validation_error.field,
                    "expected": validation_error.expected,
                    "received": validation_error.received,
                    "reason": validation_error.reason,
                },
            )

        if state.retry_count < 2:
            state.retry_count += 1
            state.status = "retried"
            state.error = "Final output failed schema validation; retrying with errors"
            decision = "Retrying from IR generation with validation errors in state"
        else:
            state.status = "failed"
            state.error = "Final output failed schema validation after 2 retries"
            decision = "Failed because retry budget is exhausted"

        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        await publish_event(
            state.task_id,
            {
                "event": "log",
                "agent": "Validator",
                "action": "validation_decision",
                "input": log.input_snapshot,
                "output": {
                    "status": state.status,
                    "retry_count": state.retry_count,
                    "validation_errors": [
                        error.model_dump(mode="json") for error in state.validation_errors
                    ],
                },
                "timestamp": utc_now().isoformat(),
                "decision": decision,
            },
        )
        return state

    except Exception as exc:
        state.status = "failed"
        state.error = f"Validation failed: {exc}"
        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        return state


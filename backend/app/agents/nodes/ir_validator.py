"""IR validation node."""

from __future__ import annotations

from time import perf_counter

from pydantic import ValidationError as PydanticValidationError

from app.agents.state import LogEntry, TaskState, ValidationError, utc_now
from app.schemas.ir_schemas import IR_SCHEMA_BY_TASK_TYPE
from app.services.redis_client import publish_event


async def ir_validator(state: TaskState) -> TaskState:
    """Validate compact IR against the schema for the classified task type."""
    started = perf_counter()
    task_type = state.task_type or "custom"
    schema = IR_SCHEMA_BY_TASK_TYPE[task_type]
    log = LogEntry(
        agent="IRValidator",
        action="validate_intermediate_representation",
        input_snapshot={"task_type": task_type, "ir": state.ir},
    )

    try:
        await publish_event(
            state.task_id,
            {
                "event": "node_start",
                "node": "IRValidator",
                "timestamp": utc_now().isoformat(),
            },
        )
        validated_ir = schema.model_validate(state.ir)
        state.ir = validated_ir.model_dump()
        entry = log.with_output(
            {"valid": True, "ir": state.ir},
            decision="IR is valid for the selected task type",
            duration_ms=int((perf_counter() - started) * 1000),
        )
        state.logs.append(entry)
        await publish_event(
            state.task_id,
            {
                "event": "log",
                "agent": entry.agent,
                "action": entry.action,
                "input": entry.input_snapshot,
                "output": entry.output_snapshot,
                "timestamp": entry.timestamp.isoformat(),
            },
        )
        return state

    except PydanticValidationError as exc:
        state.status = "failed"
        state.error = "IR validation failed"
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
        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        return state

    except Exception as exc:
        state.status = "failed"
        state.error = f"IR validation failed: {exc}"
        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        return state


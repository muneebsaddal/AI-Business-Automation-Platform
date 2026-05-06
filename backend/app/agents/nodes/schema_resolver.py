"""Schema resolver node."""

from __future__ import annotations

from time import perf_counter

from app.agents.state import LogEntry, TaskState, utc_now
from app.schemas.task_schemas import TASK_OUTPUT_SCHEMA_BY_TASK_TYPE
from app.services.llm_client import chat_complete_json
from app.services.redis_client import publish_event


def _schema_instructions(task_type: str) -> str:
    schema = TASK_OUTPUT_SCHEMA_BY_TASK_TYPE[task_type]
    fields = schema.model_json_schema()["properties"]
    required = schema.model_json_schema().get("required", [])
    return (
        f"Return JSON for {schema.__name__}. Required fields: {required}. "
        f"Available fields and constraints: {fields}."
    )


def _build_messages(state: TaskState) -> list[dict[str, str]]:
    task_type = state.task_type or "custom"
    return [
        {
            "role": "system",
            "content": (
                "You resolve a validated compact IR into a full draft business output. "
                "Return JSON only. Use the original task text for factual details. "
                "If a detail is missing, use a clear placeholder such as unknown or an "
                "empty list instead of inventing specifics."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Task type: {task_type}\n"
                f"{_schema_instructions(task_type)}\n"
                f"Validated IR:\n{state.ir}\n\n"
                f"Original task:\n{state.raw_input}"
            ),
        },
    ]


async def schema_resolver(state: TaskState) -> TaskState:
    """Map validated IR into the draft final output structure."""
    started = perf_counter()
    task_type = state.task_type or "custom"
    log = LogEntry(
        agent="SchemaResolver",
        action="resolve_ir_to_output_schema",
        input_snapshot={
            "task_type": task_type,
            "ir": state.ir,
        },
    )

    try:
        await publish_event(
            state.task_id,
            {
                "event": "node_start",
                "node": "SchemaResolver",
                "timestamp": utc_now().isoformat(),
            },
        )
        draft_output = await chat_complete_json(_build_messages(state))
        state.final_output = draft_output
        entry = log.with_output(
            {"final_output": draft_output},
            decision="Resolved validated IR into draft final output",
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
    except Exception as exc:
        state.status = "failed"
        state.error = f"Schema resolution failed: {exc}"
        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        return state


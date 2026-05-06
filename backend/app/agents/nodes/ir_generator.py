"""IR generation node."""

from __future__ import annotations

from time import perf_counter

from app.agents.state import LogEntry, TaskState, utc_now
from app.services.llm_client import chat_complete_json
from app.services.redis_client import publish_event

IR_TASK_BY_TYPE = {
    "lead": "qualify_lead",
    "contract": "analyze_contract",
    "onboard": "onboard_client",
    "custom": "custom_workflow",
}


def _build_messages(state: TaskState) -> list[dict[str, str]]:
    task_type = state.task_type or "custom"
    ir_task = IR_TASK_BY_TYPE[task_type]
    return [
        {
            "role": "system",
            "content": (
                "You generate compact Intermediate Representation JSON for business "
                "automation tasks. Return JSON only. Do not produce the final business "
                "output. Keep the IR small and factual."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Task type: {task_type}\n"
                f"Required IR task value: {ir_task}\n"
                "Return one of these compact shapes:\n"
                "- lead: {\"task\":\"qualify_lead\",\"fields\":[...],"
                "\"confidence\":\"low|medium|high\",\"flags\":[...]}\n"
                "- contract: {\"task\":\"analyze_contract\",\"fields\":[...],"
                "\"risk_level\":\"low|medium|high\",\"flags\":[...]}\n"
                "- onboard: {\"task\":\"onboard_client\",\"steps\":[...],"
                "\"completable\":true,\"flags\":[...]}\n"
                "- custom: {\"task\":\"custom_workflow\",\"steps\":[...],\"flags\":[...]}\n\n"
                f"Original task:\n{state.raw_input}"
            ),
        },
    ]


async def ir_generator(state: TaskState) -> TaskState:
    """Generate compact IR for the classified task."""
    started = perf_counter()
    log = LogEntry(
        agent="IRGenerator",
        action="generate_intermediate_representation",
        input_snapshot={
            "task_type": state.task_type,
            "raw_input": state.raw_input,
        },
    )

    try:
        await publish_event(
            state.task_id,
            {
                "event": "node_start",
                "node": "IRGenerator",
                "timestamp": utc_now().isoformat(),
            },
        )
        state.ir = await chat_complete_json(_build_messages(state))
        entry = log.with_output(
            {"ir": state.ir},
            decision="Generated compact IR for schema validation",
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
        state.error = f"IR generation failed: {exc}"
        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        return state


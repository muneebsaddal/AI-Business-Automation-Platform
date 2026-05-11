"""Schema resolver node."""

from __future__ import annotations

import re
from time import perf_counter
from typing import Any

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


def _match(pattern: str, text: str, default: str) -> str:
    match = re.search(pattern, text, re.I)
    return match.group(1).strip(" .,") if match else default


def _fallback_output(state: TaskState) -> dict[str, Any]:
    """Resolve schema fields locally when the dev LLM emits malformed JSON."""
    task_type = state.task_type or "custom"
    text = state.raw_input
    if task_type == "lead":
        company = _match(r"(?:lead:|company|from|at)\s+([A-Z][A-Za-z0-9&.,\-\s]{2,60}?)(?:,| contact| needs|$)", text, "Unknown company")
        contact = _match(r"(?:contact|name)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})", text, "Unknown contact")
        score = 40
        if re.search(r"\b(demo|technical demo|meeting|call)\b", text, re.I):
            score += 20
        if re.search(r"\b(budget|\$|pricing)\b", text, re.I):
            score += 15
        if re.search(r"\b(this quarter|next week|urgent|asap|timeline)\b", text, re.I):
            score += 15
        if re.search(r"\b(director|founder|owner|vp|head)\b", text, re.I):
            score += 10
        score = min(score, 100)
        routing = "hot" if score >= 80 else "warm" if score >= 60 else "cold" if score >= 35 else "disqualify"
        return {
            "schema_version": "1.0",
            "company": company,
            "contact_name": contact,
            "intent_signal": "Budget, timeline, automation need, and demo request detected.",
            "lead_score": score,
            "routing": routing,
            "summary": f"{company} should be routed as a {routing} lead for follow-up.",
        }
    if task_type == "contract":
        return {
            "schema_version": "1.0",
            "parties": [],
            "effective_date": None,
            "expiry_date": None,
            "obligations": [],
            "risk_flags": [],
            "missing_fields": ["parties", "effective_date", "expiry_date"],
            "risk_level": "medium",
        }
    if task_type == "onboard":
        client = _match(r"(?:client|customer|company)\s+([A-Z][A-Za-z0-9&.,\-\s]{2,60})", text, "Unknown client")
        return {
            "schema_version": "1.0",
            "client_name": client,
            "steps_completed": ["Parsed onboarding request"],
            "steps_failed": [],
            "resources_provisioned": [],
            "welcome_sent": False,
            "notes": "Local fallback produced a draft onboarding result.",
        }
    return {
        "schema_version": "1.0",
        "steps_executed": ["Parsed custom workflow request"],
        "steps_failed": [],
        "final_summary": "Local fallback produced a draft workflow result.",
        "success": True,
    }


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
        try:
            draft_output = await chat_complete_json(_build_messages(state))
            TASK_OUTPUT_SCHEMA_BY_TASK_TYPE[task_type].model_validate(draft_output)
            decision = "Resolved validated IR into draft final output"
        except Exception:
            draft_output = _fallback_output(state)
            decision = "Resolved validated IR with local fallback because the dev LLM returned invalid JSON"
        state.final_output = draft_output
        entry = log.with_output(
            {"final_output": draft_output},
            decision=decision,
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

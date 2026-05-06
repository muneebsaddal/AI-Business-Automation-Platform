"""Planner node."""

from __future__ import annotations

from time import perf_counter
from typing import Any

from pydantic import BaseModel, Field

from app.agents.state import LogEntry, PlanStep, TaskState, utc_now
from app.services.llm_client import chat_complete_json
from app.services.redis_client import publish_event


class PlannerOutput(BaseModel):
    """Validated response contract for the planner LLM call."""

    steps: list[PlanStep] = Field(min_length=1, max_length=8)


def _allowed_tools_for_task_type(task_type: str) -> list[str]:
    if task_type == "lead":
        return [
            "extract_company_info",
            "extract_intent_signals",
            "score_lead",
            "classify_routing",
        ]
    if task_type == "contract":
        return [
            "extract_parties",
            "extract_dates",
            "extract_obligations",
            "flag_risks",
            "find_missing_fields",
        ]
    if task_type == "onboard":
        return [
            "parse_onboarding_steps",
            "simulate_account_setup",
            "simulate_welcome_email",
            "simulate_resource_provisioning",
        ]
    return ["parse_custom_steps", "execute_custom_step"]


def _build_messages(state: TaskState) -> list[dict[str, str]]:
    task_type = state.task_type or "custom"
    allowed_tools = _allowed_tools_for_task_type(task_type)
    return [
        {
            "role": "system",
            "content": (
                "You are a planner agent for an AI business automation platform. "
                "Return JSON only with a top-level 'steps' array. Create between 1 "
                "and 8 ordered steps. Every step must include step_number, name, "
                "description, tool, estimated_cost_usd, and status='pending'. "
                "Use only the allowed tool names."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Task type: {task_type}\n"
                f"Allowed tools: {allowed_tools}\n"
                f"Validated IR: {state.ir}\n"
                f"Draft final output: {state.final_output}\n"
                f"Original task: {state.raw_input}"
            ),
        },
    ]


def _normalize_steps(raw_steps: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized = []
    for index, raw_step in enumerate(raw_steps[:8], start=1):
        step = dict(raw_step)
        step["step_number"] = int(step.get("step_number") or index)
        step["status"] = "pending"
        step["estimated_cost_usd"] = float(step.get("estimated_cost_usd") or 0.0)
        normalized.append(step)
    return normalized


async def planner(state: TaskState) -> TaskState:
    """Create an ordered execution plan from the validated IR."""
    started = perf_counter()
    task_type = state.task_type or "custom"
    log = LogEntry(
        agent="Planner",
        action="create_execution_plan",
        input_snapshot={
            "task_type": task_type,
            "ir": state.ir,
            "final_output": state.final_output,
        },
    )

    try:
        await publish_event(
            state.task_id,
            {
                "event": "node_start",
                "node": "Planner",
                "timestamp": utc_now().isoformat(),
            },
        )
        raw_result = await chat_complete_json(_build_messages(state))
        raw_steps = raw_result.get("steps", [])
        plan = PlannerOutput.model_validate({"steps": _normalize_steps(raw_steps)})
        state.plan = plan.steps

        entry = log.with_output(
            {"plan": [step.model_dump() for step in state.plan]},
            decision=f"Created {len(state.plan)} execution steps",
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
        state.error = f"Planning failed: {exc}"
        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        return state


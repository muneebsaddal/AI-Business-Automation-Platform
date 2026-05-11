"""Intent classification node for the master agent graph."""

from __future__ import annotations

import re
from time import perf_counter
from typing import Literal

from pydantic import BaseModel, Field

from app.agents.state import LogEntry, TaskState, utc_now
from app.services.llm_client import chat_complete_json
from app.services.redis_client import publish_event


class IntentClassifierOutput(BaseModel):
    """Validated JSON contract expected from the LLM."""

    task_type: Literal["lead", "contract", "onboard", "custom"]
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str


def _build_messages(state: TaskState) -> list[dict[str, str]]:
    """Build the classifier prompt."""
    return [
        {
            "role": "system",
            "content": (
                "You classify business automation tasks. Return JSON only with: "
                "task_type, confidence, reasoning. task_type must be one of "
                "lead, contract, onboard, custom. Use lead for lead qualification "
                "or sales routing, contract for agreement/legal document review, "
                "onboard for client onboarding/setup, and custom when none fit."
            ),
        },
        {
            "role": "user",
            "content": (
                f"User hint: {state.task_type_hint}\n"
                f"Task description:\n{state.raw_input}"
            ),
        },
    ]


def _fallback_classification(state: TaskState) -> IntentClassifierOutput:
    """Classify locally when the dev LLM returns unusable JSON."""
    if state.task_type_hint != "auto":
        return IntentClassifierOutput(
            task_type=state.task_type_hint,
            confidence=0.9,
            reasoning="Used the explicit task type hint because local LLM output was unavailable.",
        )

    text = state.raw_input.lower()
    patterns = {
        "lead": r"\b(lead|prospect|sales|demo|budget|quote)\b",
        "contract": r"\b(contract|agreement|clause|legal|obligation|risk)\b",
        "onboard": r"\b(onboard|setup|welcome|provision|new client)\b",
    }
    for task_type, pattern in patterns.items():
        if re.search(pattern, text):
            return IntentClassifierOutput(
                task_type=task_type,
                confidence=0.75,
                reasoning="Used local keyword classification because local LLM output was unavailable.",
            )
    return IntentClassifierOutput(
        task_type="custom",
        confidence=0.6,
        reasoning="Used the local fallback classifier.",
    )


async def intent_classifier(state: TaskState) -> TaskState:
    """Classify the raw user task and set the route for the graph."""
    started = perf_counter()
    state.status = "running"

    log = LogEntry(
        agent="IntentClassifier",
        action="classify_task_type",
        input_snapshot={
            "raw_input": state.raw_input,
            "task_type_hint": state.task_type_hint,
        },
    )

    try:
        await publish_event(
            state.task_id,
            {
                "event": "node_start",
                "node": "IntentClassifier",
                "timestamp": utc_now().isoformat(),
            },
        )

        try:
            raw_result = await chat_complete_json(_build_messages(state))
            result = IntentClassifierOutput.model_validate(raw_result)
            decision = f"Route task to {result.task_type} pipeline"
        except Exception:
            result = _fallback_classification(state)
            decision = f"Route task to {result.task_type} pipeline using local fallback"
        state.task_type = result.task_type

        output = result.model_dump()
        entry = log.with_output(
            output,
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
        state.error = f"Intent classification failed: {exc}"
        entry = log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        state.logs.append(entry)
        return state

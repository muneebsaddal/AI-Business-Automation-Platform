"""Executor node."""

from __future__ import annotations

import inspect
from time import perf_counter
from typing import Any

from app.agents.state import LogEntry, StepResult, TaskState, utc_now
from app.services.redis_client import publish_event


def _load_tool_registry() -> dict[str, Any]:
    """Load the tool registry when Step 9 tools exist."""
    try:
        from app.tools import TOOL_REGISTRY

        return TOOL_REGISTRY
    except ModuleNotFoundError:
        return {}


def _tool_input(state: TaskState, step_number: int) -> dict[str, Any]:
    return {
        "task_id": state.task_id,
        "task_type": state.task_type,
        "raw_input": state.raw_input,
        "ir": state.ir,
        "final_output": state.final_output,
        "previous_results": [result.model_dump() for result in state.step_results],
        "step_number": step_number,
    }


async def _call_tool(tool: Any, payload: dict[str, Any]) -> Any:
    result = tool(payload)
    if inspect.isawaitable(result):
        return await result
    return result


async def executor(state: TaskState) -> TaskState:
    """Run each planned step using registered tool functions."""
    started = perf_counter()
    registry = _load_tool_registry()
    log = LogEntry(
        agent="Executor",
        action="execute_plan_steps",
        input_snapshot={"plan": [step.model_dump() for step in state.plan]},
    )

    try:
        await publish_event(
            state.task_id,
            {
                "event": "node_start",
                "node": "Executor",
                "timestamp": utc_now().isoformat(),
            },
        )

        state.step_results = []
        for step in state.plan:
            step_started = perf_counter()
            step.status = "running"
            payload = _tool_input(state, step.step_number)
            tool = registry.get(step.tool)

            if tool is None:
                step.status = "failed"
                result = StepResult(
                    step_number=step.step_number,
                    tool=step.tool,
                    input_data=payload,
                    output_data={},
                    success=False,
                    error=f"Tool '{step.tool}' is not registered yet",
                    duration_ms=int((perf_counter() - step_started) * 1000),
                )
            else:
                try:
                    output = await _call_tool(tool, payload)
                    step.status = "done"
                    result = StepResult(
                        step_number=step.step_number,
                        tool=step.tool,
                        input_data=payload,
                        output_data=output if isinstance(output, dict) else {"result": output},
                        success=True,
                        duration_ms=int((perf_counter() - step_started) * 1000),
                    )
                except Exception as exc:
                    step.status = "failed"
                    result = StepResult(
                        step_number=step.step_number,
                        tool=step.tool,
                        input_data=payload,
                        output_data={},
                        success=False,
                        error=str(exc),
                        duration_ms=int((perf_counter() - step_started) * 1000),
                    )

            state.step_results.append(result)
            state.cost_usd += step.estimated_cost_usd
            await publish_event(
                state.task_id,
                {
                    "event": "log",
                    "agent": "Executor",
                    "action": f"execute_step_{step.step_number}",
                    "input": payload,
                    "output": result.model_dump(mode="json"),
                    "timestamp": utc_now().isoformat(),
                },
            )

        entry = log.with_output(
            {"step_results": [result.model_dump() for result in state.step_results]},
            decision="Executed all planned steps; validator will decide final status",
            duration_ms=int((perf_counter() - started) * 1000),
        )
        state.logs.append(entry)
        return state
    except Exception as exc:
        state.status = "failed"
        state.error = f"Execution failed: {exc}"
        state.logs.append(
            log.with_error(state.error, duration_ms=int((perf_counter() - started) * 1000))
        )
        return state


"""Simulated custom workflow tools."""

from __future__ import annotations

import re
from typing import Any


def _text(payload: dict[str, Any]) -> str:
    return str(payload.get("raw_input") or "")


def parse_custom_steps(payload: dict[str, Any]) -> dict[str, Any]:
    """Parse a generic workflow into simple steps."""
    text = _text(payload)
    parts = [part.strip(" .") for part in re.split(r",|;|\n| then ", text) if part.strip()]
    return {"steps": parts or [text[:120] or "custom workflow step"]}


def execute_custom_step(payload: dict[str, Any]) -> dict[str, Any]:
    """Simulate executing a generic workflow step."""
    step_description = "custom step"
    previous = payload.get("previous_results", [])
    for result in previous:
        output = result.get("output_data", {})
        steps = output.get("steps", [])
        if steps:
            step_description = steps[0]
            break
    return {
        "success": True,
        "output": f"Simulated completion: {step_description}",
        "notes": "No external systems were called.",
    }


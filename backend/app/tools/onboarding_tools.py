"""Simulated client onboarding tools."""

from __future__ import annotations

import hashlib
import re
from typing import Any


def _text(payload: dict[str, Any]) -> str:
    return str(payload.get("raw_input") or "")


def _client_name(text: str) -> str:
    match = re.search(r"(?:client|for|onboard)\s+([A-Z][A-Za-z0-9&.,\-\s]{2,60})", text)
    return match.group(1).strip(" .,") if match else "New client"


def parse_onboarding_steps(payload: dict[str, Any]) -> dict[str, Any]:
    """Parse onboarding actions from the brief."""
    text = _text(payload)
    steps = re.findall(r"(?:setup|create|send|provision|schedule|invite)\s+[^,.]+", text, re.I)
    if not steps:
        steps = ["create account", "send welcome email", "provision resources"]
    return {"steps": [step.strip() for step in steps]}


def simulate_account_setup(payload: dict[str, Any]) -> dict[str, Any]:
    """Simulate account creation."""
    client_name = _client_name(_text(payload))
    digest = hashlib.sha1(client_name.encode("utf-8")).hexdigest()[:8]
    return {"success": True, "account_id": f"acct_{digest}", "client_name": client_name}


def simulate_welcome_email(payload: dict[str, Any]) -> dict[str, Any]:
    """Simulate sending a welcome email."""
    client_name = _client_name(_text(payload))
    return {"sent": True, "template_used": "standard_client_welcome", "client_name": client_name}


def simulate_resource_provisioning(payload: dict[str, Any]) -> dict[str, Any]:
    """Simulate resource provisioning."""
    previous = payload.get("previous_results", [])
    parsed_steps = []
    for result in previous:
        output = result.get("output_data", {})
        parsed_steps.extend(output.get("steps", []))
    provisioned = parsed_steps or ["workspace", "shared folder", "project board"]
    return {"provisioned": provisioned, "failed": []}


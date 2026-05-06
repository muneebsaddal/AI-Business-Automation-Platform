"""Simulated lead qualification tools."""

from __future__ import annotations

import re
from typing import Any


def _text(payload: dict[str, Any]) -> str:
    return str(payload.get("raw_input") or "")


def _extract_email(text: str) -> str | None:
    match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    return match.group(0) if match else None


def _extract_phone(text: str) -> str | None:
    match = re.search(r"(?:\+?\d[\d\s().-]{7,}\d)", text)
    return match.group(0).strip() if match else None


def extract_company_info(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract obvious company and contact details from the lead text."""
    text = _text(payload)
    email = _extract_email(text)
    phone = _extract_phone(text)
    company_patterns = [
        r"(?:company|from|at)\s+([A-Z][A-Za-z0-9&.,\-\s]{2,60})",
        r"([A-Z][A-Za-z0-9&.-]+(?:\s+[A-Z][A-Za-z0-9&.-]+){0,3})[, ]+(?:contact|lead)",
    ]
    contact_patterns = [
        r"(?:contact|name|ask for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})",
        r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}),\s*(?:operations|director|manager|founder)",
    ]

    company = "Unknown company"
    for pattern in company_patterns:
        match = re.search(pattern, text)
        if match:
            company = match.group(1).strip(" .,")
            break

    contact_name = "Unknown contact"
    for pattern in contact_patterns:
        match = re.search(pattern, text)
        if match:
            contact_name = match.group(1).strip(" .,")
            break

    return {
        "company": company,
        "contact_name": contact_name,
        "email": email,
        "phone": phone,
    }


def extract_intent_signals(payload: dict[str, Any]) -> dict[str, Any]:
    """Find simple buying-intent signals in the lead text."""
    text = _text(payload).lower()
    signal_keywords = {
        "demo_requested": ["demo", "call", "meeting", "walkthrough"],
        "budget_mentioned": ["budget", "$", "usd", "pricing"],
        "timeline_mentioned": ["timeline", "this quarter", "next week", "urgent", "asap"],
        "automation_need": ["automation", "workflow", "follow-up", "onboarding"],
        "decision_maker": ["director", "founder", "owner", "vp", "head of"],
    }
    signals = [
        signal
        for signal, keywords in signal_keywords.items()
        if any(keyword in text for keyword in keywords)
    ]
    strongest = signals[0] if signals else "general_interest"
    return {"signals": signals, "strongest": strongest}


def score_lead(payload: dict[str, Any]) -> dict[str, Any]:
    """Score a lead using transparent simulated business rules."""
    text = _text(payload).lower()
    previous = payload.get("previous_results", [])
    score = 35
    reasons = ["base inbound interest"]

    if any(term in text for term in ["demo", "meeting", "call", "walkthrough"]):
        score += 20
        reasons.append("requested a conversation or demo")
    if any(term in text for term in ["budget", "$", "pricing"]):
        score += 15
        reasons.append("budget or pricing mentioned")
    if any(term in text for term in ["this quarter", "next week", "urgent", "asap"]):
        score += 15
        reasons.append("clear timeline")
    if any(term in text for term in ["director", "founder", "owner", "vp"]):
        score += 10
        reasons.append("senior buyer signal")
    if "student" in text or "free" in text:
        score -= 25
        reasons.append("low commercial fit signal")

    if previous:
        score += 5
        reasons.append("supporting extracted signals available")

    return {"score": max(0, min(score, 100)), "reasoning": "; ".join(reasons)}


def classify_routing(payload: dict[str, Any]) -> dict[str, Any]:
    """Route a lead based on score and intent."""
    score = 0
    for result in reversed(payload.get("previous_results", [])):
        output = result.get("output_data", {})
        if "score" in output:
            score = int(output["score"])
            break

    if score >= 80:
        routing = "hot"
    elif score >= 60:
        routing = "warm"
    elif score >= 35:
        routing = "cold"
    else:
        routing = "disqualify"

    return {
        "routing": routing,
        "next_action": {
            "hot": "Book discovery call within 24 hours",
            "warm": "Send tailored follow-up and ask qualifying question",
            "cold": "Add to nurture sequence",
            "disqualify": "Archive or request more fit information",
        }[routing],
    }


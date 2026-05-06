"""Simulated contract analysis tools."""

from __future__ import annotations

import re
from typing import Any


def _text(payload: dict[str, Any]) -> str:
    return str(payload.get("raw_input") or "")


def extract_parties(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract likely contract parties from simple text patterns."""
    text = _text(payload)
    parties = re.findall(r"\b[A-Z][A-Za-z0-9&.,\s]+(?:LLC|Inc|Ltd|Corporation|Company)\b", text)
    return {"parties": list(dict.fromkeys(party.strip() for party in parties))}


def extract_dates(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract date-like strings."""
    text = _text(payload)
    dates = re.findall(
        r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|[A-Z][a-z]+ \d{1,2}, \d{4})\b",
        text,
    )
    return {
        "effective_date": dates[0] if dates else None,
        "expiry_date": dates[1] if len(dates) > 1 else None,
        "other_dates": dates[2:],
    }


def extract_obligations(payload: dict[str, Any]) -> dict[str, Any]:
    """Extract simple obligation sentences."""
    text = _text(payload)
    sentences = re.split(r"(?<=[.!?])\s+", text)
    obligations = [
        sentence.strip()
        for sentence in sentences
        if any(term in sentence.lower() for term in ["shall", "must", "will", "responsible"])
    ]
    return {"obligations": obligations}


def flag_risks(payload: dict[str, Any]) -> dict[str, Any]:
    """Flag simple contract risk signals."""
    text = _text(payload).lower()
    risk_flags = []
    if "auto-renew" in text or "automatic renewal" in text:
        risk_flags.append("automatic renewal")
    if "unlimited liability" in text:
        risk_flags.append("unlimited liability")
    if "terminate" not in text:
        risk_flags.append("missing termination language")
    if "confidential" not in text:
        risk_flags.append("missing confidentiality language")

    risk_level = "high" if len(risk_flags) >= 3 else "medium" if risk_flags else "low"
    return {"risk_flags": risk_flags, "risk_level": risk_level}


def find_missing_fields(payload: dict[str, Any]) -> dict[str, Any]:
    """Find expected contract fields that are not obvious in the text."""
    text = _text(payload).lower()
    required_fields = ["parties", "effective date", "expiry", "payment", "termination"]
    missing = [field for field in required_fields if field not in text]
    return {"missing": missing}


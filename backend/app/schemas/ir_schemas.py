"""Compact intermediate representation schemas for task routing pipelines."""

from typing import Literal

from pydantic import BaseModel, Field


class LeadIR(BaseModel):
    """Compact IR for lead qualification tasks."""

    task: Literal["qualify_lead"] = "qualify_lead"
    fields: list[str] = Field(default_factory=list)
    confidence: Literal["low", "medium", "high"] = "medium"
    flags: list[str] = Field(default_factory=list)


class ContractIR(BaseModel):
    """Compact IR for contract analysis tasks."""

    task: Literal["analyze_contract"] = "analyze_contract"
    fields: list[str] = Field(default_factory=list)
    risk_level: Literal["low", "medium", "high"] = "medium"
    flags: list[str] = Field(default_factory=list)


class OnboardIR(BaseModel):
    """Compact IR for client onboarding tasks."""

    task: Literal["onboard_client"] = "onboard_client"
    steps: list[str] = Field(default_factory=list)
    completable: bool = True
    flags: list[str] = Field(default_factory=list)


class CustomIR(BaseModel):
    """Compact IR for custom workflow tasks."""

    task: Literal["custom_workflow"] = "custom_workflow"
    steps: list[str] = Field(default_factory=list)
    flags: list[str] = Field(default_factory=list)


IR_SCHEMA_BY_TASK_TYPE = {
    "lead": LeadIR,
    "contract": ContractIR,
    "onboard": OnboardIR,
    "custom": CustomIR,
}


"""Full versioned output schemas for supported business task types."""

from typing import Literal

from pydantic import BaseModel, Field


class LeadQualificationOutput(BaseModel):
    """Final output contract for lead qualification."""

    schema_version: str = "1.0"
    company: str
    contact_name: str
    intent_signal: str
    lead_score: int = Field(ge=0, le=100)
    routing: Literal["hot", "warm", "cold", "disqualify"]
    summary: str


class ContractAnalysisOutput(BaseModel):
    """Final output contract for contract analysis."""

    schema_version: str = "1.0"
    parties: list[str] = Field(default_factory=list)
    effective_date: str | None = None
    expiry_date: str | None = None
    obligations: list[str] = Field(default_factory=list)
    risk_flags: list[str] = Field(default_factory=list)
    missing_fields: list[str] = Field(default_factory=list)
    risk_level: Literal["low", "medium", "high"]


class ClientOnboardingOutput(BaseModel):
    """Final output contract for client onboarding."""

    schema_version: str = "1.0"
    client_name: str
    steps_completed: list[str] = Field(default_factory=list)
    steps_failed: list[str] = Field(default_factory=list)
    resources_provisioned: list[str] = Field(default_factory=list)
    welcome_sent: bool
    notes: str


class CustomWorkflowOutput(BaseModel):
    """Final output contract for custom workflows."""

    schema_version: str = "1.0"
    steps_executed: list[str] = Field(default_factory=list)
    steps_failed: list[str] = Field(default_factory=list)
    final_summary: str
    success: bool


TASK_OUTPUT_SCHEMA_BY_TASK_TYPE = {
    "lead": LeadQualificationOutput,
    "contract": ContractAnalysisOutput,
    "onboard": ClientOnboardingOutput,
    "custom": CustomWorkflowOutput,
}


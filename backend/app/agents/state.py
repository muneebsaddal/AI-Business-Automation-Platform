"""Shared state models for agent orchestration."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

TaskType = Literal["lead", "contract", "onboard", "custom"]
TaskTypeHint = Literal["auto", "lead", "contract", "onboard", "custom"]
TaskStatus = Literal["pending", "running", "success", "failed", "retried", "escalated"]
StepStatus = Literal["pending", "running", "done", "failed"]


def utc_now() -> datetime:
    """Return a timezone-aware UTC timestamp."""
    return datetime.now(UTC)


class LogEntry(BaseModel):
    """Single audit-log entry for an agent action."""

    timestamp: datetime = Field(default_factory=utc_now)
    agent: str
    action: str
    input_snapshot: dict[str, Any] = Field(default_factory=dict)
    output_snapshot: dict[str, Any] | None = None
    decision: str | None = None
    error: str | None = None
    duration_ms: int | None = None

    def with_output(
        self,
        output: dict[str, Any],
        decision: str | None = None,
        duration_ms: int | None = None,
    ) -> LogEntry:
        """Return this log entry with a successful output attached."""
        return self.model_copy(
            update={
                "output_snapshot": output,
                "decision": decision,
                "duration_ms": duration_ms,
            }
        )

    def with_error(self, error: str, duration_ms: int | None = None) -> LogEntry:
        """Return this log entry with failure details attached."""
        return self.model_copy(update={"error": error, "duration_ms": duration_ms})


class PlanStep(BaseModel):
    """A planned unit of work for the executor agent."""

    step_number: int
    name: str
    description: str
    tool: str
    estimated_cost_usd: float = 0.0
    status: StepStatus = "pending"


class StepResult(BaseModel):
    """Result captured after an executor tool call."""

    step_number: int
    tool: str
    input_data: dict[str, Any] = Field(default_factory=dict)
    output_data: dict[str, Any] = Field(default_factory=dict)
    success: bool
    error: str | None = None
    duration_ms: int | None = None


class ValidationError(BaseModel):
    """Field-level validation issue from the validator agent."""

    field: str
    expected: str
    received: Any = None
    reason: str


class TaskState(BaseModel):
    """Shared LangGraph state passed between every agent node."""

    task_id: str
    user_id: str
    raw_input: str
    task_type: TaskType | None = None
    task_type_hint: TaskTypeHint = "auto"
    ir: dict[str, Any] = Field(default_factory=dict)
    plan: list[PlanStep] = Field(default_factory=list)
    step_results: list[StepResult] = Field(default_factory=list)
    final_output: dict[str, Any] | None = None
    validation_errors: list[ValidationError] = Field(default_factory=list)
    confidence_scores: dict[str, float] = Field(default_factory=dict)
    status: TaskStatus = "pending"
    retry_count: int = 0
    logs: list[LogEntry] = Field(default_factory=list)
    error: str | None = None
    cost_usd: float = 0.0
    started_at: datetime | None = None
    completed_at: datetime | None = None

    def add_log(self, entry: LogEntry) -> None:
        """Append a log entry to the execution trace."""
        self.logs.append(entry)


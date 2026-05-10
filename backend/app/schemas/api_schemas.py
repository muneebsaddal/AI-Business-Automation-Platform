"""Pydantic request/response schemas for API endpoints."""

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field

# ── Auth ──────────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    name: str

    model_config = {"from_attributes": True}


# ── Tasks ─────────────────────────────────────────────────────────────────────

TaskTypeHint = Literal["auto", "lead", "contract", "onboard", "custom"]


class ExecuteRequest(BaseModel):
    title: str
    description: str
    task_type_hint: TaskTypeHint = "auto"
    file_base64: str | None = None


class ExecuteResponse(BaseModel):
    task_id: str
    status: str
    ws_url: str


class TaskSummaryResponse(BaseModel):
    id: str
    title: str
    description: str
    task_type_hint: str
    task_type: str | None = None
    status: str
    retry_count: int
    cost_usd: float
    duration_ms: int | None = None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class TaskDetailResponse(TaskSummaryResponse):
    final_output: dict[str, Any] | None = None
    execution_trace: list[dict[str, Any]] = Field(default_factory=list)
    validation_errors: list[dict[str, Any]] = Field(default_factory=list)
    confidence_scores: dict[str, float] = Field(default_factory=dict)
    failure_reason: str | None = None
    has_file: bool = False


class TaskListResponse(BaseModel):
    items: list[TaskSummaryResponse]
    total: int
    page: int
    limit: int


class RerunResponse(BaseModel):
    task_id: str
    status: str
    ws_url: str


class AnalyticsResponse(BaseModel):
    total_tasks: int
    success_rate: float
    avg_duration_ms: float
    total_cost_usd: float
    by_status: dict[str, int]
    by_type: dict[str, int]
    recent_tasks: list[TaskSummaryResponse]

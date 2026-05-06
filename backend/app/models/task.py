"""Task model — stores task submissions, execution results, and full traces."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Submission fields
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # auto | lead | contract | onboard | custom
    task_type_hint: Mapped[str] = mapped_column(String(50), default="auto")

    # Set by IntentClassifier agent
    task_type: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)

    # Execution status
    status: Mapped[str] = mapped_column(String(50), default="pending", index=True)
    # pending | running | success | failed | retried | escalated

    # Results (stored as JSON strings)
    # Validated output JSON
    final_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Full step-by-step trace JSON
    execution_trace: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Field-level errors JSON
    validation_errors: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Per-field scores JSON
    confidence_scores: Mapped[str | None] = mapped_column(Text, nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # File attachment
    has_file: Mapped[bool] = mapped_column(default=False, nullable=False)
    file_content: Mapped[str | None] = mapped_column(Text, nullable=True)  # base64 encoded PDF

    # Metrics
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:
        return f"<Task id={self.id} type={self.task_type} status={self.status}>"

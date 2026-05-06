# AI Business Automation Platform - Project Brief

This brief condenses `AI_Automation_Platform_Handover_v2.docx` into a smaller working reference for future development sessions.

## One-Sentence Purpose

A multi-agent AI operations platform where a business user submits an operational task in plain English, the system classifies it, plans the work, executes typed steps, validates the output against schemas, and streams the full execution trace to a dashboard.

## Portfolio Story

The strongest client-facing story is: "AI operations cockpit for service businesses."

Target example client: a small B2B agency or consultancy that handles inbound leads and follow-up work but does not yet have reliable automation around qualification, routing, and next actions.

Reason for this positioning: the demo should be understandable without a heavy sales conversation. Lead qualification is revenue-adjacent, familiar to most business owners, and easy to show in a live dashboard. The product should sell itself through a before/after story: messy inbound request in, scored and validated next action out.

Demo narrative:

1. A user submits a real business task, such as qualifying a sales lead, reviewing a contract, onboarding a client, or running a custom workflow.
2. The platform immediately creates a tracked job and starts a live execution stream.
3. The dashboard shows each agent step: intent classification, structured extraction, planning, execution, validation, retries, and final output.
4. The final result is not just an AI answer. It includes schema-valid JSON, confidence scores, validation errors when relevant, cost, duration, and a replayable trace.
5. The business value is auditability: clients can see what automation did, why it did it, where it failed, and whether the result is safe to use.

This should be marketed as an execution layer, not a chatbot. The differentiator is transparent, schema-governed automation with retry/failure behavior.

## Current Implementation State

Completed:

- Backend foundation: FastAPI app, CORS, health endpoint, global exception handler.
- Configuration: `.env` driven settings and a `USE_OPENAI` toggle.
- Database: SQLAlchemy async engine, `User` and `Task` models, Alembic migration.
- Auth: register, login, refresh, logout, and `/auth/me` with JWT.
- Password hashing: direct `bcrypt`, not `passlib`.
- LLM client: unified async client for Ollama dev mode and OpenAI production mode.
- Step 5 state layer: `TaskState`, execution log models, plan/result/validation models, and Redis helpers.
- Step 6 graph foundation: master LangGraph skeleton, conditional task-type routing, and `IntentClassifier`.
- Step 7 IR pattern: compact IR schemas, full task output schemas, IR generator, IR validator, and schema resolver.

Not yet implemented:

- Planner, executor, validator nodes.
- Task tools for lead, contract, onboarding, and custom workflows.
- Task CRUD, execute endpoint, Celery worker.
- WebSocket task stream.
- Frontend React dashboard.
- Docker Compose, CI, and deployment.

## Current File Map

- `backend/app/main.py`: FastAPI app setup and `/health`.
- `backend/app/config.py`: Pydantic settings loaded from `.env`.
- `backend/app/database.py`: async SQLAlchemy engine/session/Base.
- `backend/app/models/user.py`: user table model.
- `backend/app/models/task.py`: task table model with JSON stored as text fields.
- `backend/app/middleware/auth.py`: bcrypt helpers, JWT helpers, current-user dependency.
- `backend/app/routers/auth.py`: auth routes.
- `backend/app/schemas/api_schemas.py`: auth request/response schemas.
- `backend/app/services/llm_client.py`: `chat_complete`, `chat_complete_json`, `clean_json`.
- `backend/alembic/versions/0001_initial_tables.py`: initial users/tasks migration.

## Intended Architecture

Request flow:

1. React posts a task to `POST /execute` with a JWT.
2. FastAPI creates a `Task` record and enqueues a Celery worker.
3. Celery runs the LangGraph pipeline in the background.
4. Each graph node publishes events to Redis channel `task_events:{task_id}`.
5. WebSocket endpoint `/ws/{task_id}` streams Redis events to the browser.
6. On completion, PostgreSQL stores final output, execution trace, validation errors, confidence scores, cost, and duration.

Agent flow:

1. `IntentClassifier`: detects `lead`, `contract`, `onboard`, or `custom`.
2. `IRGenerator`: asks the LLM for a compact intermediate representation.
3. `IRValidator`: validates the IR with Pydantic.
4. `SchemaResolver`: maps IR into the full output schema.
5. `Planner`: creates up to 8 typed execution steps.
6. `Executor`: runs registered tool functions and captures results.
7. `Validator`: validates final output, computes field confidence, and decides pass, retry, escalate, or fail.
8. `Output`: persists and streams the result.

## Key Design Rules

- The LLM should see compact IR requirements, not the full output schema.
- All final outputs must validate through Pydantic.
- Never silently pass partial or invalid outputs.
- Retry validation failures at most 2 times with error context injected.
- Escalate low-confidence outputs instead of pretending they succeeded.
- Store Task JSON fields as text and use `json.dumps` / `json.loads`.
- Use Pydantic v2 style.
- Use SQLAlchemy `mapped_column`, not legacy `Column`.
- Use direct `bcrypt`; do not add `passlib`.
- Keep development order step-by-step from the handover.

## Build Progress

Step 5 is complete: TaskState schema and Redis client.

Files to create:

- `backend/app/agents/__init__.py`
- `backend/app/agents/state.py`
- `backend/app/agents/nodes/__init__.py`
- `backend/app/services/redis_client.py`

Core models:

- `TaskState`: shared LangGraph state.
- `LogEntry`: timestamped agent action with input/output snapshots and error support.
- `PlanStep`: planned executor step.
- `StepResult`: tool execution result.
- `ValidationError`: field-level validation issue.

Redis service functions:

- `get_redis()`
- `set_task_state(task_id, state_dict, ttl=3600)`
- `get_task_state(task_id)`
- `publish_event(task_id, event_dict)`
- `subscribe_task_events(task_id)`
- `ping()`

Step 6 is complete: LangGraph graph and IntentClassifier.

Files created:

- `backend/app/agents/graph.py`
- `backend/app/agents/nodes/intent_classifier.py`

What Step 6 adds:

- A compiled LangGraph object exposed as `compiled_graph`.
- The first real graph node: `IntentClassifier`.
- A validated LLM output contract: `task_type`, `confidence`, `reasoning`.
- Conditional routing to `lead_pipeline`, `contract_pipeline`, `onboard_pipeline`, or `custom_pipeline`.
- Temporary branch stubs so the graph compiles before later nodes exist.

Step 7 is complete: IR pattern nodes and schemas.

Files created:

- `backend/app/schemas/ir_schemas.py`
- `backend/app/schemas/task_schemas.py`
- `backend/app/agents/nodes/ir_generator.py`
- `backend/app/agents/nodes/ir_validator.py`
- `backend/app/agents/nodes/schema_resolver.py`
- `docs/langgraph_step7.md`

What Step 7 adds:

- Compact task-specific IR schemas for lead, contract, onboarding, and custom workflows.
- Versioned task output schemas for the fuller business result.
- `IRGenerator`, which asks the LLM for compact IR only.
- `IRValidator`, which Pydantic-validates the IR and records field-level errors.
- `SchemaResolver`, which expands validated IR into a draft `final_output`.
- Graph wiring from task-type branch stubs into `IRGenerator -> IRValidator -> SchemaResolver`.

## Suggested Client Demo Scenarios

Best first scenario: lead qualification for a B2B agency.

Why it works:

- Easy for clients to understand quickly.
- Output can be structured: company, contact, intent signal, score, routing, summary.
- The live graph makes the platform feel operational, not like a chat wrapper.
- It connects directly to revenue workflows.

Example task:

> Qualify this inbound lead: Acme Logistics, contact Sarah Khan, operations director. They need workflow automation for quote follow-ups and customer onboarding. Budget mentioned is around $8k, timeline is this quarter, and they asked for a technical demo next week.

Expected output:

- Lead score: 0-100.
- Routing: hot, warm, cold, or disqualify.
- Intent signal.
- Recommended next action.
- Summary.
- Confidence scores and validation trace.

Secondary scenarios:

- Contract analyzer: extract parties, dates, obligations, missing fields, and risk flags.
- Client onboarder: turn a new-client brief into a checklist and simulated provisioning trace.
- Custom workflow: break arbitrary operations into visible steps with success/failure tracking.

Build order decision:

- Build one killer workflow first: lead qualification.
- Use simulated tools first.
- Keep architecture extensible for contract, onboarding, custom workflows, and real integrations later.
- Frontend should make the lead workflow feel complete and valuable before expanding breadth.

## Open Product Questions

1. How polished should the dashboard be before backend completion: simple functional UI first, or portfolio-grade visual experience early?
2. Should users bring their own OpenAI key in the demo, or should production use one server-side key?
3. What should the lead workflow's simulated "external systems" be called: CRM, enrichment service, email sequencer, or generic internal tools?

# AI Business Automation Platform Agent Guide

This file is the fast handover for future coding agents working in this repository.

## Product Story

This is a portfolio project for a client-facing "AI operations cockpit for service businesses." The strongest demo scenario is lead qualification for a B2B agency or consultancy.

Position it as an execution layer, not a chatbot:

- A user submits an operational task in plain English.
- The backend classifies intent, creates an execution plan, runs typed tool steps, validates the output, and records a trace.
- The frontend shows the live agent graph, execution events, final JSON, confidence, validation errors, export, and replay.
- The client value is auditability: users can see what automation did, why it did it, and whether it is safe to use.

Primary demo task:

```text
Qualify this inbound lead: Acme Logistics, contact Sarah Khan, operations director. They need workflow automation for quote follow-ups and customer onboarding. Budget mentioned is around $8k, timeline is this quarter, and they asked for a technical demo next week.
```

## Architecture

- Frontend: React 18, Vite 5, Tailwind CSS 3, React Router, TanStack Query, Zustand.
- Backend: FastAPI, LangGraph, Pydantic v2, SQLAlchemy 2, Alembic, Celery.
- State and streaming: Redis stores live task state and publishes task events.
- Persistence: Postgres stores users, tasks, execution traces, validation data, cost, and duration.
- LLM provider: one `USE_OPENAI` flag switches between local Ollama and OpenAI.

Request flow:

1. React posts to `POST /execute` with a JWT.
2. FastAPI creates a task record and queues Celery.
3. Celery runs `compiled_graph.ainvoke(...)`.
4. Graph nodes publish Redis events to `task_events:{task_id}`.
5. `/ws/{task_id}?token=...` streams events to the browser.
6. Final output and trace are persisted to Postgres.

Agent flow:

1. `IntentClassifier`
2. `IRGenerator`
3. `IRValidator`
4. `SchemaResolver`
5. `Planner`
6. `Executor`
7. `Validator`
8. persisted output and streamed trace

## Important Files

- `docs/project_brief.md`: compact source of truth for project context and build history.
- `docs/deployment.md`: production hosting guide.
- `docker-compose.yml`: full local stack with Postgres, Redis, backend, Celery, and frontend.
- `backend/app/agents/graph.py`: LangGraph wiring.
- `backend/app/agents/state.py`: shared task state model.
- `backend/app/agents/nodes/`: agent node implementations.
- `backend/app/tools/`: simulated tool registry and task-specific tools.
- `backend/app/services/task_service.py`: task persistence, analytics, export, rerun.
- `backend/app/routers/`: auth, execute, tasks, and WebSocket API routes.
- `frontend/src/pages/`: main app screens.
- `frontend/src/api/`: API client and task API wrappers.
- `frontend/src/store/`: persisted auth and settings stores.

## Development Commands

Backend:

```bash
cd backend
pip install -e ".[dev]"
alembic upgrade head
uvicorn app.main:app --reload
```

Celery worker:

```bash
cd backend
celery -A app.celery_app worker --loglevel=info
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Full local stack:

```bash
docker compose up --build
```

Verification:

```bash
cd backend
python -m ruff check app
python -m compileall app -q

cd frontend
npm run lint
npm run build

cd ..
docker compose config
```

Note: backend `pytest` is not a useful required check yet because there is no committed `backend/tests` suite.

## Code Rules

- Preserve the IR pattern: LLM prompts should use compact IR schemas, not the full output schema.
- All final outputs must validate through Pydantic.
- Never silently pass partial or invalid outputs.
- Retry validation failures at most 2 times with error context.
- Escalate low-confidence outputs instead of pretending success.
- Store task JSON fields as text and use `json.dumps` / `json.loads`.
- Use Pydantic v2 style.
- Use SQLAlchemy 2 `mapped_column`, not legacy `Column`.
- Use direct `bcrypt`; do not add `passlib`.
- Keep simulated tools until there is a deliberate real-integration step.
- Keep the lead qualification workflow as the clearest portfolio story.

## Git Rules

- Commit as `muneebsaddal <muneebsaddal@outlook.com>`.
- Keep commits focused and explain what changed in plain language.
- Do not revert unrelated user changes.
- Push only when the user asks.

## Good Next Work

The original handover build plan is complete. Good next steps are:

- Add backend tests for auth, task service, graph routing, and validator behavior.
- Add one real integration behind the simulated lead workflow, such as a CRM-style webhook or email draft output.
- Deploy a public demo using the split hosting plan in `docs/deployment.md`.
- Improve the frontend bundle by code-splitting chart-heavy pages.
- Harden the demo data and polish the client-facing README narrative.

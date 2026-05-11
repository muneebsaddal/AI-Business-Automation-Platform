# Deployment Guide

This project is easiest to demo locally with Docker Compose and easiest to host as split services:

- Frontend: Vercel or Netlify static build.
- Backend API: Railway, Render, Fly.io, or any container host.
- Worker: a second backend service running the Celery command.
- Database: managed Postgres, for example Supabase, Railway, or Neon.
- Redis: managed Redis, for example Redis Cloud, Upstash, or Railway Redis.

## Production Services

### Backend API

Use `backend/Dockerfile`.

Build command:

```bash
pip install -e .
```

Start command:

```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

Important environment variables:

- `USE_OPENAI=true`
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `SECRET_KEY`
- `ENVIRONMENT=production`
- `CORS_ORIGINS=https://your-frontend-domain.com`

### Celery Worker

Deploy a second service from the same backend image.

Start command:

```bash
celery -A app.celery_app worker --loglevel=info
```

The worker must use the same `DATABASE_URL`, `REDIS_URL`, and LLM variables as the API service.

### Frontend

Build from `frontend`.

Install command:

```bash
npm ci
```

Build command:

```bash
npm run build
```

Publish directory:

```text
frontend/dist
```

Environment:

- `VITE_API_URL=https://your-backend-domain.com`

## Local Full-Stack Demo

Docker Compose starts Postgres, Redis, the backend API, Celery, and the Vite frontend:

```bash
docker compose up --build
```

Then open:

- Frontend: `http://localhost:5173`
- API docs: `http://localhost:8000/docs`

## CI

GitHub Actions runs three checks on push and pull request:

- Backend: install, `ruff check app`, and `python -m compileall app -q`.
- Frontend: `npm ci`, `npm run lint`, and `npm run build`.
- Compose: `docker compose config`.

There are no backend tests yet, so CI intentionally avoids `pytest` until a `backend/tests` suite exists.

## Demo Checklist

Before a client-facing demo:

1. Set `USE_OPENAI=true` and confirm the OpenAI key is available to the backend and worker.
2. Confirm `CORS_ORIGINS` exactly matches the deployed frontend URL.
3. Run one lead qualification task from the frontend.
4. Verify the task detail page shows the live trace, final JSON output, confidence fields, and export/replay actions.
5. Keep the lead scenario as the main story; contract, onboarding, and custom workflows are secondary examples.

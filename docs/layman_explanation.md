# AI Business Automation Platform, in Plain English

This project is a web app that lets a business type in a work request, then watches a group of software "agents" handle it step by step.

Think of it like a small operations team inside an app:

1. One agent reads the request and decides what kind of work it is.
2. Another agent turns the request into a simple checklist the computer can understand.
3. Another checks that the checklist makes sense.
4. Another prepares the final business result.
5. Another plans the steps needed to complete the work.
6. Another runs those steps using built-in tools.
7. Another checks the final answer before the user sees it.

The important part is that the app does not just give a mysterious answer. It shows the full path it took, so a person can see what happened.

## What Problem It Solves

Many businesses have repeated admin work that starts as messy text:

- A sales lead comes in from a form or email.
- A customer needs onboarding.
- A contract needs review.
- A support handoff needs turning into action items.

Normally, a person has to read the text, decide what kind of work it is, pull out the useful details, decide what to do next, and write a clean result.

This app automates that flow while keeping the work visible and reviewable.

## Example

A user might submit:

> Qualify this inbound lead: Acme Logistics, contact Sarah Khan, operations director. They need workflow automation for quote follow-ups and customer onboarding. Budget is around $8k, timeline is this quarter, and they asked for a technical demo next week.

The app can turn that into a structured result:

- Company: Acme Logistics
- Contact: Sarah Khan
- Lead score: high
- Routing: hot lead
- Summary: follow up quickly because budget, timeline, and demo request are all strong buying signals

It also shows the agent graph and trace, so the user can see how the app reached that result.

## What The Dashboard Shows

The dashboard is the control room.

It shows:

- How many tasks have been run.
- How many succeeded.
- How long tasks took.
- Recent task submissions.
- A history page where previous runs can be opened again.

The task detail page shows the most important part: the live execution path. Each node in the graph represents one stage of the automation pipeline.

## What "Agents" Mean Here

In this project, an agent is not a person and not a magic bot. It is a focused piece of software responsible for one part of the job.

For example:

- `IntentClassifier` decides the type of task.
- `IRGenerator` creates a compact internal version of the request.
- `IRValidator` checks that internal version.
- `SchemaResolver` creates a properly shaped business output.
- `Planner` decides which tools should run.
- `Executor` runs those tools.
- `Validator` checks the final answer.

Splitting the work like this makes the system easier to debug. If something goes wrong, you can see which stage failed.

## Why There Is A Trace

The trace is the receipt for the work.

Instead of only saying "done", the app records:

- Which agent ran.
- What input it received.
- What output it produced.
- What decision it made.
- Whether it failed or succeeded.

This matters for business workflows because people need to trust, audit, and replay automated decisions.

## Local Demo vs Paid AI

The app can run locally with Ollama, which means you can test it without paying for API calls.

Local models are useful for development, but they sometimes return messy output. The app includes fallbacks so common demo workflows can still complete even when the local model is imperfect.

Later, the same app can be switched to OpenAI by changing environment variables. The idea is:

- Use Ollama while building and debugging.
- Use OpenAI when you want stronger production-quality model output.

## Why Docker Is Used

Docker starts all the pieces the app needs:

- The frontend website.
- The FastAPI backend.
- The Celery worker that runs background jobs.
- Postgres for saved task history.
- Redis for live task events.

This makes the project easier to run because the services start together instead of being launched one by one.

## What Happens When You Click "Run Automation"

In simple terms:

1. The frontend sends the task to the backend.
2. The backend saves the task in the database.
3. A background worker picks up the task.
4. The agent graph runs step by step.
5. Redis streams live progress back to the browser.
6. The final output and trace are saved.
7. The task page updates to success, failed, or escalated.

The user does not have to wait on a frozen page. The work happens in the background and the UI updates as events arrive.

## What This Is Not

This is not just a chat window.

A chat window usually gives one answer and hides how it got there. This platform is designed more like an operations engine:

- It stores tasks.
- It runs repeatable workflows.
- It validates outputs.
- It shows the execution trace.
- It lets users inspect old runs.

That makes it better suited for business processes where consistency and accountability matter.

## Future Direction

The next natural step is to let users add or configure agents and workflows from the dashboard. That would turn the current fixed pipeline into a more flexible operations builder.

For now, the project proves the core loop: submit work, classify it, execute it, validate it, stream progress, and store the result.

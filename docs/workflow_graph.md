# Workflow Graph

This document replaces the old intermediate `langgraph_step*` notes with final workflow diagrams.

## Client-Facing Workflow

Use this graph when explaining the project to a client or portfolio reviewer. It focuses on business value: traceable automation, not chat.

```mermaid
flowchart TD
    A["Business user submits an operational task"] --> B["FastAPI creates a tracked task"]
    B --> C["Celery runs the task in the background"]
    C --> D["LangGraph orchestrates agent steps"]
    D --> E["Redis publishes live execution events"]
    E --> F["WebSocket streams progress to the browser"]
    F --> G["Dashboard shows graph, trace, output, validation, cost, duration"]
    D --> H["Postgres stores final output and replayable trace"]
    H --> I["User exports or replays the automation"]
```

## Agent Execution Workflow

Use this graph when explaining the backend agent pipeline.

```mermaid
flowchart TD
    Start(["Task input"]) --> Intent["IntentClassifier"]
    Intent --> Branch{"Task type"}
    Branch -->|"lead"| Lead["LeadPipeline"]
    Branch -->|"contract"| Contract["ContractPipeline"]
    Branch -->|"onboard"| Onboard["OnboardPipeline"]
    Branch -->|"custom"| Custom["CustomPipeline"]
    Lead --> IRGen["IRGenerator"]
    Contract --> IRGen
    Onboard --> IRGen
    Custom --> IRGen
    IRGen --> IRVal["IRValidator"]
    IRVal -->|"valid"| Resolver["SchemaResolver"]
    IRVal -->|"failed"| Failed(["Failed with structured error"])
    Resolver --> Planner["Planner"]
    Planner --> Executor["Executor"]
    Executor --> Validator["Validator"]
    Validator --> Decision{"Validation decision"}
    Decision -->|"pass"| Done(["Persist output and complete"])
    Decision -->|"retry"| IRGen
    Decision -->|"escalate"| Escalated(["Escalate for review"])
    Decision -->|"fail"| Failed
```

## Generated LangGraph Workflow

The diagrams above are curated for humans. To export the actual compiled LangGraph structure from code, run:

```bash
cd backend
python scripts/export_graph.py
```

To write it to a Mermaid file:

```bash
cd backend
python scripts/export_graph.py --output ../docs/generated_langgraph.mmd
```

The export script uses:

```python
compiled_graph.get_graph().draw_mermaid()
```

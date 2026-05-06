# Step 8 LangGraph Visualization

Step 8 adds the execution heart of the platform: planning, execution, validation, retry, escalation, and failure routing.

```mermaid
flowchart TD
    Input["TaskState input"]
    Intent["IntentClassifier"]
    Branch{"task_type"}
    Lead["LeadPipeline marker"]
    Contract["ContractPipeline marker"]
    Onboard["OnboardPipeline marker"]
    Custom["CustomPipeline marker"]
    IRGen["IRGenerator"]
    IRVal["IRValidator"]
    Resolver["SchemaResolver"]
    Planner["Planner\ncreates PlanStep list"]
    Executor["Executor\nruns registered tools"]
    Validator["Validator\nschema + confidence check"]
    Decision{"validation decision"}
    End["END"]

    Input --> Intent
    Intent --> Branch
    Branch -->|"lead"| Lead
    Branch -->|"contract"| Contract
    Branch -->|"onboard"| Onboard
    Branch -->|"custom"| Custom
    Branch -->|"failed"| End
    Lead --> IRGen
    Contract --> IRGen
    Onboard --> IRGen
    Custom --> IRGen
    IRGen --> IRVal
    IRVal -->|"valid"| Resolver
    IRVal -->|"invalid"| End
    Resolver --> Planner
    Planner --> Executor
    Executor --> Validator
    Validator --> Decision
    Decision -->|"pass"| End
    Decision -->|"retry < 2"| IRGen
    Decision -->|"escalate"| End
    Decision -->|"fail"| End
```

## What Changed

- `Planner` creates an ordered list of up to 8 `PlanStep` records.
- `Executor` runs each step against `TOOL_REGISTRY` when Step 9 tools exist.
- `Validator` checks `final_output` against the full task schema.
- Validation failures retry from `IRGenerator` up to 2 times.
- Low-confidence valid outputs become `escalated`.
- Valid, confident outputs become `success`.

## Why Step 9 Still Matters

The executor is wired now, but the simulated tool functions are not created until Step 9. Until then, planned tools will be reported as unregistered. That is expected at this stage.


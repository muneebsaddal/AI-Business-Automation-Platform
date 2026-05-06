# Step 7 LangGraph Visualization

This is the graph after adding the IR pattern. `IntentClassifier` still chooses the broad business task type, then the selected branch flows into shared IR nodes.

```mermaid
flowchart TD
    Input["TaskState input"]
    Intent["IntentClassifier\nclassifies task_type"]
    Route{"route_by_task_type"}
    Lead["LeadPipeline\nbranch marker"]
    Contract["ContractPipeline\nbranch marker"]
    Onboard["OnboardPipeline\nbranch marker"]
    Custom["CustomPipeline\nbranch marker"]
    IRGen["IRGenerator\ncompact IR JSON"]
    IRVal["IRValidator\nPydantic IR check"]
    Valid{"IR valid?"}
    Resolver["SchemaResolver\ndraft final_output"]
    End["END"]

    Input --> Intent
    Intent --> Route
    Route -->|"lead"| Lead
    Route -->|"contract"| Contract
    Route -->|"onboard"| Onboard
    Route -->|"custom or missing"| Custom
    Route -->|"failed"| End
    Lead --> IRGen
    Contract --> IRGen
    Onboard --> IRGen
    Custom --> IRGen
    IRGen --> IRVal
    IRVal --> Valid
    Valid -->|"yes"| Resolver
    Valid -->|"no"| End
    Resolver --> End
```

## Why The IR Layer Exists

The IR layer keeps the first LLM output small. Instead of asking the model to produce a large final object immediately, the platform asks for a compact representation first, validates it, and only then expands it into the fuller business output shape.

This matters because small contracts are easier for an LLM to follow and easier for us to reject safely when malformed.


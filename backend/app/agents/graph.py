"""Master LangGraph definition for the agent orchestration pipeline."""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.agents.nodes.intent_classifier import intent_classifier
from app.agents.nodes.ir_generator import ir_generator
from app.agents.nodes.ir_validator import ir_validator
from app.agents.nodes.schema_resolver import schema_resolver
from app.agents.state import LogEntry, TaskState


def _stub_pipeline(name: str):
    """Return a temporary pipeline node until later steps add real logic."""

    async def pipeline(state: TaskState) -> TaskState:
        state.logs.append(
            LogEntry(
                agent=name,
                action="pipeline_stub",
                input_snapshot={"task_type": state.task_type},
            ).with_output(
                {"status": "stubbed"},
                decision=f"{name} is reserved for a later build step",
            )
        )
        return state

    return pipeline


def route_by_task_type(state: TaskState) -> str:
    """Choose the next graph branch after intent classification."""
    if state.status == "failed":
        return "end"
    return state.task_type or "custom"


def route_after_ir_validation(state: TaskState) -> str:
    """Continue only when IR validation succeeded."""
    if state.status == "failed":
        return "end"
    return "schema_resolver"


graph = StateGraph(TaskState)
graph.add_node("intent_classifier", intent_classifier)
graph.add_node("lead_pipeline", _stub_pipeline("LeadPipeline"))
graph.add_node("contract_pipeline", _stub_pipeline("ContractPipeline"))
graph.add_node("onboard_pipeline", _stub_pipeline("OnboardPipeline"))
graph.add_node("custom_pipeline", _stub_pipeline("CustomPipeline"))
graph.add_node("ir_generator", ir_generator)
graph.add_node("ir_validator", ir_validator)
graph.add_node("schema_resolver", schema_resolver)

graph.set_entry_point("intent_classifier")
graph.add_conditional_edges(
    "intent_classifier",
    route_by_task_type,
    {
        "lead": "lead_pipeline",
        "contract": "contract_pipeline",
        "onboard": "onboard_pipeline",
        "custom": "custom_pipeline",
        "end": END,
    },
)
graph.add_edge("lead_pipeline", "ir_generator")
graph.add_edge("contract_pipeline", "ir_generator")
graph.add_edge("onboard_pipeline", "ir_generator")
graph.add_edge("custom_pipeline", "ir_generator")
graph.add_edge("ir_generator", "ir_validator")
graph.add_conditional_edges(
    "ir_validator",
    route_after_ir_validation,
    {
        "schema_resolver": "schema_resolver",
        "end": END,
    },
)
graph.add_edge("schema_resolver", END)

compiled_graph = graph.compile()

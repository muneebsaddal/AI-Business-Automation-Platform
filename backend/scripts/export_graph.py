"""Export the compiled LangGraph workflow as Mermaid text.

Run from the backend directory:

    python scripts/export_graph.py
    python scripts/export_graph.py --output ../docs/generated_langgraph.mmd
"""

from __future__ import annotations

import argparse
from pathlib import Path

from app.agents.graph import compiled_graph


def export_mermaid() -> str:
    """Return the compiled graph structure in Mermaid format."""
    return compiled_graph.get_graph().draw_mermaid()


def main() -> None:
    parser = argparse.ArgumentParser(description="Export the LangGraph workflow as Mermaid.")
    parser.add_argument(
        "--output",
        type=Path,
        help="Optional path to write the Mermaid graph to. Prints to stdout when omitted.",
    )
    args = parser.parse_args()

    mermaid = export_mermaid()
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(mermaid, encoding="utf-8")
        print(f"Wrote LangGraph Mermaid to {args.output}")
        return

    print(mermaid)


if __name__ == "__main__":
    main()

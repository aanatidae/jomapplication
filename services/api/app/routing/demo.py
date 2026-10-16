"""Run with python -m services.api.app.routing.demo; entirely offline."""

from .engine import compute_routes
from .graph_loader import load_graph
from .models import RouteProfile


def main() -> None:
    graph = load_graph()
    print("SIMULATED / DEMO - local metre coordinates; not real-world guidance")
    for profile in RouteProfile:
        result = compute_routes(
            graph,
            graph.graph["demo_origin"],
            graph.graph["demo_destination"],
            profile,
        )[0]
        print(f"\n{profile.name}\n{result.estimated_time_s / 60:g} min / {result.distance_m:g} m")
        print(" -> ".join(result.node_path))
        print("\n".join(result.reasons))
        print(f"Data confidence: {result.confidence.level}; as of {result.confidence.as_of}")
        for warning in result.confidence.factors:
            print(f"Data warning: {warning}")


if __name__ == "__main__":
    main()

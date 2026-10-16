"""Load an explicit directed graph; reverse movement needs its own edge record."""

from pathlib import Path

import networkx as nx
from pydantic import ValidationError

from .errors import GraphDataError
from .models import PilotData

DEFAULT_PILOT_PATH = Path(__file__).resolve().parents[2] / "data/pilot/simulated_demo.json"


def graph_from_json(contents: str | bytes) -> nx.DiGraph:
    try:
        data = PilotData.model_validate_json(contents)
    except ValidationError as error:
        raise GraphDataError(f"Invalid pilot graph: {error}") from error
    graph = nx.DiGraph(
        dataset_id=data.dataset_id,
        data_kind=data.data_kind,
        description=data.description,
        coordinate_system=data.coordinate_system,
        reference_time=data.reference_time,
        demo_origin=data.demo_origin,
        demo_destination=data.demo_destination,
    )
    # Sorted insertion gives NetworkX a canonical traversal order independent of JSON order.
    for node in sorted(data.nodes, key=lambda item: item.id):
        graph.add_node(node.id, record=node)
    for edge in sorted(data.edges, key=lambda item: item.segment_id):
        graph.add_edge(edge.start_node, edge.end_node, record=edge)
    return nx.freeze(graph)


def load_graph(path: Path = DEFAULT_PILOT_PATH) -> nx.DiGraph:
    try:
        contents = path.read_bytes()
    except OSError as error:
        raise GraphDataError(f"Cannot read pilot graph: {path}") from error
    return graph_from_json(contents)

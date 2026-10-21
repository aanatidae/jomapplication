"""Request-local, allowlisted hackathon simulation. Never edits the cached graph."""

from itertools import pairwise

import networkx as nx

from .engine import compute_routes, path_edges
from .errors import NoRouteError

DEMO_CLOSURE_ID = "brickfields_crossing_1264710459"
CROSSING_NODES = ("osm_11749673973", "osm_4619870919", "osm_6148809817")
PEDESTRIAN_HIGHWAYS = {"footway", "pedestrian", "path", "steps", "corridor"}


def demo_crossing(graph: nx.DiGraph) -> dict:
    """Fail closed if the supported crossing changes in a future extract."""
    if graph.graph.get("data_kind") != "OPENSTREETMAP":
        raise ValueError("Demo crossing requires the Brickfields OpenStreetMap graph")
    for a, b in pairwise(CROSSING_NODES):
        for u, v in ((a, b), (b, a)):
            edge = graph.get_edge_data(u, v, {}).get("record")
            if (edge is None or edge.osm_way_id != 1264710459 or edge.is_closed
                    or edge.osm_tags.get("footway") != "crossing"):
                raise ValueError("Supported demo crossing is unavailable")
    longitude, latitude = graph.nodes[CROSSING_NODES[1]]["record"].coordinates
    return {"id": DEMO_CLOSURE_ID, "latitude": latitude, "longitude": longitude,
            "label": "NU Sentral crossing · OSM 1264710459"}


def with_demo_closure(graph: nx.DiGraph, origin: str, destination: str) -> nx.DiGraph:
    demo_crossing(graph)
    baseline = compute_routes(graph, origin, destination, "fastest", max_results=1)[0]
    pairs = list(pairwise(baseline.node_path))
    edges = path_edges(graph, baseline.node_path)
    def blocked(a, b):
        return graph[a][b]["record"].osm_way_id == 1264710459

    closed = nx.subgraph_view(graph, filter_edge=lambda a, b: not blocked(a, b))
    if not any(blocked(a, b) for a, b in pairs):
        return closed

    # A closure detour must use mapped pedestrian infrastructure between crossings.
    # Retain the ordinary route's endpoint approaches (including permitted service
    # access), rather than banning roads needed to reach an origin/destination.
    crossings = [i for i, edge in enumerate(edges)
                 if edge.osm_tags.get("footway") == "crossing"]
    if not crossings:
        raise NoRouteError("No suitable mapped pedestrian alternative")
    approach = set(pairs[:crossings[0]] + pairs[crossings[-1] + 1:])
    return nx.subgraph_view(closed, filter_edge=lambda a, b: (
        graph[a][b]["record"].osm_tags.get("highway") in PEDESTRIAN_HIGHWAYS
        or (a, b) in approach
    ))

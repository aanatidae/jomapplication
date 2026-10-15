"""Phase 0 transport spike; not the production routing contract."""

from itertools import pairwise

import networkx as nx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Jom! technical spike")


class SpikeRequest(BaseModel):
    origin: str = "origin"
    destination: str = "destination"


def tiny_graph() -> nx.Graph:
    """Entirely simulated geometry and times, with no real-world claims."""
    graph = nx.Graph(dataset="simulated-demo")
    for name, coordinates in {
        "origin": [101.600, 3.100],
        "middle": [101.601, 3.101],
        "destination": [101.602, 3.100],
    }.items():
        graph.add_node(name, coordinates=coordinates)
    graph.add_edge("origin", "middle", estimated_time_s=60)
    graph.add_edge("middle", "destination", estimated_time_s=60)
    graph.add_edge("origin", "destination", estimated_time_s=180)
    return graph


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/spikes/route")
def route(request: SpikeRequest) -> dict:
    graph = tiny_graph()
    try:
        nodes = nx.dijkstra_path(
            graph, request.origin, request.destination, weight="estimated_time_s"
        )
    except (nx.NodeNotFound, nx.NetworkXNoPath) as error:
        raise HTTPException(status_code=404, detail="No demo route found") from error
    return {
        "dataset": graph.graph["dataset"],
        "nodes": nodes,
        "estimated_time_s": sum(
            graph[a][b]["estimated_time_s"] for a, b in pairwise(nodes)
        ),
        "geometry": {
            "type": "LineString",
            "coordinates": [graph.nodes[node]["coordinates"] for node in nodes],
        },
        "warning": "Simulated technical fixture; accessibility and safety unknown.",
    }

"""A simulated closure is isolated, reversible, and never fabricates a detour."""

from itertools import pairwise

import networkx as nx
import pytest
from fastapi.testclient import TestClient

from services.api.app.api.routes import get_graph
from services.api.app.main import app
from services.api.app.routing.demo_closure import (
    CROSSING_NODES,
    DEMO_CLOSURE_ID,
    PEDESTRIAN_HIGHWAYS,
    demo_crossing,
    with_demo_closure,
)
from services.api.app.routing.engine import compute_routes, path_edges
from services.api.app.routing.errors import NoRouteError
from services.api.app.routing.osm_import import DENIED, load_osm_graph

NU, MCKL = "osm_7045493653", "osm_11443497173"


@pytest.fixture(scope="module")
def graph():
    return load_osm_graph()


def test_closure_uses_exact_crossing_geometry_and_removes_both_directions(graph):
    crossing = demo_crossing(graph)
    assert (crossing["longitude"], crossing["latitude"]) == (
        graph.nodes[CROSSING_NODES[1]]["record"].coordinates
    )
    closed = with_demo_closure(graph, NU, MCKL)
    for a, b in pairwise(CROSSING_NODES):
        for u, v in ((a, b), (b, a)):
            assert not closed.has_edge(u, v)
            assert graph.has_edge(u, v) and not graph[u][v]["record"].is_closed


def test_detour_is_real_pedestrian_topology_and_reset_restores_original(graph):
    original = compute_routes(graph, NU, MCKL, "fastest", max_results=1)[0]
    closed = with_demo_closure(graph, NU, MCKL)
    detour = compute_routes(closed, NU, MCKL, "fastest", max_results=1)[0]
    assert original.distance_m == pytest.approx(468.7688498)
    assert detour.distance_m == pytest.approx(515.3131166)
    assert detour.estimated_time_s == pytest.approx(detour.distance_m / 1.25)
    assert detour.distance_m > original.distance_m
    for u, v in pairwise(detour.node_path):
        edge = graph[u][v]["record"]
        assert edge is closed[u][v]["record"]
        assert edge.osm_way_id != 1264710459 and not edge.is_closed
        assert edge.osm_tags.get("foot") not in DENIED
        assert edge.osm_tags.get("access") not in DENIED or edge.osm_tags.get("foot") in {
            "yes", "designated", "permissive",
        }
        # Only the pre-existing NU endpoint service access needs ordinary road edges.
        assert edge.osm_tags["highway"] in PEDESTRIAN_HIGHWAYS or edge.osm_way_id in {
            1131114443, 1131114444,
        }
    crossings = [edge for edge in path_edges(graph, detour.node_path)
                 if edge.osm_tags.get("footway") == "crossing"]
    assert len(crossings) == 17
    assert len({edge.osm_way_id for edge in crossings}) == 8
    for way in {edge.osm_way_id for edge in crossings}:
        full_crossing = {frozenset((u, v)) for u, v, data in graph.edges(data=True)
                         if data["record"].osm_way_id == way}
        traversed = {frozenset((u, v)) for u, v in pairwise(detour.node_path)
                     if graph[u][v]["record"].osm_way_id == way}
        assert traversed == full_crossing
    assert detour.data_quality.accessibility_incomplete
    assert detour.data_quality.last_verified_at is None
    for _ in range(2):
        assert compute_routes(graph, NU, MCKL, "fastest", max_results=1)[0] == original
        assert compute_routes(with_demo_closure(graph, NU, MCKL), NU, MCKL,
                              "fastest", max_results=1)[0] == detour


def test_no_connected_alternative_fails_without_reopening_crossing(graph):
    original = compute_routes(graph, NU, MCKL, "fastest", max_results=1)[0]
    pairs = set(pairwise(original.node_path))
    pairs |= {(b, a) for a, b in tuple(pairs)}
    corridor = nx.subgraph_view(graph, filter_edge=lambda a, b: (a, b) in pairs)
    with pytest.raises(NoRouteError):
        compute_routes(with_demo_closure(corridor, NU, MCKL), NU, MCKL,
                       "fastest", max_results=1)


def test_other_endpoints_and_reverse_still_route(graph):
    for a, b in [("osm_7045493654", MCKL), (MCKL, NU),
                 ("osm_11925140813", NU)]:
        normal = compute_routes(graph, a, b, "fastest", max_results=1)[0]
        detour = compute_routes(with_demo_closure(graph, a, b), a, b,
                                "fastest", max_results=1)[0]
        assert detour.node_path[0] == a and detour.node_path[-1] == b
        assert all(edge.osm_way_id != 1264710459
                   for edge in path_edges(graph, detour.node_path))
        assert compute_routes(graph, a, b, "fastest", max_results=1)[0] == normal


def test_http_contract_allowlists_simulation_and_keeps_profiles_unavailable(graph):
    app.dependency_overrides[get_graph] = lambda: graph
    try:
        with TestClient(app) as client:
            assert client.get("/v1/demo-crossing").json() == demo_crossing(graph)
            body = {"origin": {"node_id": NU}, "destination": {"node_id": MCKL},
                    "profile": "fastest", "demo_closure": DEMO_CLOSURE_ID}
            response = client.post("/v1/routes", json=body)
            assert response.status_code == 200
            route = response.json()["routes"][0]
            assert route["distance_m"] == pytest.approx(515.3131166)
            assert any("Simulated crossing closure" in w for w in route["warnings"])
            for invalid in [True, "arbitrary-edge", [DEMO_CLOSURE_ID]]:
                rejected = client.post("/v1/routes", json={**body, "demo_closure": invalid})
                assert rejected.status_code == 422
            for profile in ["safer_at_night", "step_free"]:
                unavailable = client.post("/v1/routes", json={**body, "profile": profile})
                assert unavailable.status_code == 404
            reset = client.post("/v1/routes", json={**body, "demo_closure": None})
            assert reset.status_code == 200
            assert len(reset.json()["routes"]) == 1  # Geographic Fastest uses the responsive path.
            assert reset.json()["routes"][0]["distance_m"] == pytest.approx(468.7688498)
    finally:
        app.dependency_overrides.clear()

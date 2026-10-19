"""Offline regression on the checked-in real Brickfields OSM extract."""

import gzip
import json
from itertools import pairwise

import networkx as nx
import pytest
from fastapi.testclient import TestClient

from services.api.app.api.routes import get_graph
from services.api.app.main import app
from services.api.app.routing.engine import compute_routes, path_edges
from services.api.app.routing.errors import NoRouteError, RoutingInputError
from services.api.app.routing.geography import CENTER, distance_m, snap_coordinate
from services.api.app.routing.osm_import import (
    DATA_DIR,
    EXTRACT_PATH,
    edge_record,
    load_osm_graph,
    walkable,
)
from services.api.app.routing.profiles import PROFILES
from services.api.app.routing.scoring import is_edge_allowed


@pytest.fixture(scope="module")
def graph():
    return load_osm_graph()


@pytest.fixture(scope="module")
def catalog():
    return json.loads((DATA_DIR / "destinations.json").read_text(encoding="utf-8"))


@pytest.fixture
def client(graph):
    app.dependency_overrides[get_graph] = lambda: graph
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.mark.parametrize("start,end", [(0, 1), (1, 2), (2, 3)])
def test_three_real_trips_follow_original_osm_geometry(graph, catalog, start, end):
    a, b = catalog[start], catalog[end]
    route = compute_routes(graph, a["node_id"], b["node_id"], "fastest", max_results=1)[0]
    edges = path_edges(graph, route.node_path)
    raw = json.loads(gzip.decompress(EXTRACT_PATH.read_bytes()))
    ways = {e["id"]: e for e in raw["elements"] if e["type"] == "way"}
    nodes = {e["id"]: (e["lon"], e["lat"]) for e in raw["elements"]
             if e["type"] == "node" and "lat" in e}
    assert all(edge.osm_way_id in ways for edge in edges)
    assert all(walkable(ways[edge.osm_way_id].get("tags", {})) for edge in edges)
    assert route.geometry == edges[0].geometry + tuple(p for e in edges[1:] for p in e.geometry[1:])
    # Every graph segment lies on a specific source OSM way, including parallel-way midpoints.
    for edge in edges:
        way = ways[edge.osm_way_id]
        assert edge.osm_tags == way.get("tags", {})
        index = int(edge.segment_id.split("_")[2])
        source_a, source_b = (nodes[n] for n in way["nodes"][index:index + 2])
        # Parallel-way midpoint subdivisions must remain on the original OSM segment.
        for point in edge.geometry:
            assert distance_m(source_a, point) + distance_m(point, source_b) == pytest.approx(
                distance_m(source_a, source_b), abs=0.001
            )
    assert route.distance_m == pytest.approx(
        sum(distance_m(a, b) for a, b in pairwise(route.geometry))
    )
    assert route.estimated_time_s == pytest.approx(route.distance_m / 1.25)
    shortest = nx.shortest_path_length(
        graph,
        a["node_id"],
        b["node_id"],
        weight=lambda u, v, data: data["record"].estimated_time_s,
    )
    assert route.estimated_time_s == pytest.approx(shortest)
    assert all(distance_m(CENTER, p) <= 2000 for p in route.geometry)
    assert route.data_kind == "OPENSTREETMAP"
    assert route.data_quality.accessibility_incomplete
    assert route.data_quality.last_verified_at is None
    assert "SIMULATED" not in route.verification_summary
    assert not any("Better lighting" in r or "staffed security" in r for r in route.reasons)


def test_step_free_never_admits_confirmed_stairs_or_unknown_critical_fields(graph, catalog):
    stairs = [d["record"] for _, _, d in graph.edges(data=True) if d["record"].stairs is True]
    assert stairs, "Real OSM extract must include staircases for this regression"
    assert all(not is_edge_allowed(e, PROFILES["step_free"]) for e in stairs)
    eligible = [
        d["record"]
        for _, _, d in graph.edges(data=True)
        if is_edge_allowed(d["record"], PROFILES["step_free"])
    ]
    assert all(e.stairs is False for e in eligible)
    with pytest.raises(NoRouteError):
        compute_routes(graph, catalog[0]["node_id"], catalog[1]["node_id"], "step_free")


def test_geographic_http_contract(client, catalog):
    a, b = catalog[:2]
    body = {
        "origin": {k: a[k] for k in ("latitude", "longitude")},
        "destination": {k: b[k] for k in ("latitude", "longitude")},
        "profile": "fastest",
    }
    response = client.post("/v1/routes", json=body)
    assert response.status_code == 200
    value = response.json()
    assert value["data_kind"] == "OPENSTREETMAP"
    assert value["routes"][0]["geometry"]["coordinate_system"] == "WGS84"
    assert value["snapped_endpoints"]["origin"]["distance_m"] == 0
    assert value["routes"][0]["data_quality"]["last_verified_at"] is None
    body["profile"] = "step_free"
    response = client.post("/v1/routes", json=body)
    assert response.status_code == 404 and "step-free" in response.json()["detail"]
    body["origin"] = {"latitude": 0, "longitude": 0}
    assert "outside" in client.post("/v1/routes", json=body).json()["detail"]


def test_snap_limits_and_unreachable_island(graph, catalog):
    with pytest.raises(RoutingInputError, match="outside"):
        snap_coordinate(graph, 0, 0)
    g = nx.DiGraph(graph)
    origin, destination = catalog[0]["node_id"], catalog[1]["node_id"]
    g.remove_edges_from(list(g.in_edges(destination)) + list(g.out_edges(destination)))
    with pytest.raises(NoRouteError):
        compute_routes(g, origin, destination, "fastest", max_results=1)


@pytest.mark.parametrize(
    "point",
    [
        {"latitude": 91, "longitude": 101},
        {"latitude": 3},
        {"node_id": "osm_1", "latitude": 3, "longitude": 101},
        {},
    ],
)
def test_invalid_coordinate_shapes(client, point):
    assert (
        client.post(
            "/v1/routes",
            json={"origin": point, "destination": {"node_id": "osm_2"}, "profile": "fastest"},
        ).status_code
        == 422
    )


def test_osm_tags_are_not_invented_verification(graph):
    for _, _, data in graph.edges(data=True):
        e = data["record"]
        assert e.lighting_score is None and e.security_facility_distance_m is None
        assert e.confidence_score is None and e.last_updated_at is None
        assert e.verification_level == "unverified"
        if e.osm_tags.get("highway") == "steps":
            assert e.stairs is True


@pytest.mark.parametrize(
    "tags",
    [
        {"highway": "motorway"},
        {"highway": "footway", "foot": "no"},
        {"highway": "primary", "foot": "use_sidepath"},
        {"highway": "service", "access": "private"},
        {"highway": "construction"},
    ],
)
def test_import_rejects_prohibited_ways(tags):
    assert not walkable(tags)


def test_steps_cannot_be_overridden_by_contradictory_step_count(graph):
    nodes = [data["record"] for _, data in list(graph.nodes(data=True))[:2]]
    e = edge_record({"id": 1, "tags": {"highway": "steps", "step_count": "0"}}, *nodes, 0, ({}, {}))
    assert e.stairs is True

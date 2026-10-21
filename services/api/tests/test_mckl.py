"""MCKL uses existing permitted topology, never a private entrance or forced waypoint."""

import gzip
import json
from itertools import pairwise
from pathlib import Path
from types import SimpleNamespace

import networkx as nx
import pytest
from fastapi.testclient import TestClient

from services.api.app.api.routes import get_graph
from services.api.app.main import app
from services.api.app.routing.engine import _use_separate_sidewalks, compute_routes, path_edges
from services.api.app.routing.errors import NoRouteError
from services.api.app.routing.geography import distance_m, snap_coordinate
from services.api.app.routing.osm_import import (
    DATA_DIR,
    DENIED,
    EXTRACT_PATH,
    landmark_catalog,
    load_osm_graph,
)

MCKL = "osm_11443497173"
CROSSING = ("osm_11749673973", "osm_4619870919", "osm_6148809817")
NU_TEAM = (101.68764791886117, 3.1331550708543014)
KL_TEAM = (101.68596241201102, 3.134923163918838)
PRIVATE_GATE = (101.69060253963536, 3.1317691136133257)


@pytest.fixture(scope="module")
def graph():
    return load_osm_graph()


def test_catalogues_reproduce_existing_sidewalk_not_private_gate(graph):
    extract = json.loads(gzip.decompress(EXTRACT_PATH.read_bytes()))
    catalog = landmark_catalog(extract, graph)
    assert catalog == json.loads((DATA_DIR / "destinations.json").read_text(encoding="utf-8"))
    mobile = Path("apps/mobile/src/features/planner/destinations.json")
    assert catalog == json.loads(mobile.read_text(encoding="utf-8"))
    assert len(catalog) == 6
    mckl = catalog[-1]
    assert mckl["label"] == "Methodist College Kuala Lumpur (MCKL) · mapped approach"
    assert (mckl["longitude"], mckl["latitude"]) == (101.6906217, 3.1318006)
    assert mckl["node_id"] == MCKL
    assert mckl["osm_name"] is None  # The source sidewalk is unnamed, not the college POI.
    way = next(e for e in extract["elements"] if e["type"] == "way" and e["id"] == 1323590725)
    assert int(MCKL.removeprefix("osm_")) in way["nodes"]
    assert way["tags"]["footway"] == "sidewalk"
    assert not any("crossing" in p["label"].lower() for p in catalog)
    gate, gap = snap_coordinate(graph, *PRIVATE_GATE)
    assert gate == "osm_7045518924" and gap < 1
    assert graph.nodes[gate]["osm_tags"]["access"] == "private"
    assert distance_m(PRIVATE_GATE, graph.nodes[MCKL]["record"].coordinates) < 5
    with pytest.raises(NoRouteError):
        compute_routes(graph, snap_coordinate(graph, *NU_TEAM)[0], gate, "fastest", max_results=1)


@pytest.mark.parametrize("origin", [NU_TEAM, (101.687547, 3.1331516)])
def test_nu_mckl_fastest_traverses_both_actual_crossing_segments(graph, origin):
    start = snap_coordinate(graph, *origin)[0]
    route = compute_routes(graph, start, MCKL, "fastest", max_results=1)[0]
    pairs = list(pairwise(route.node_path))
    first, second = pairwise(CROSSING)
    assert pairs.index(first) + 1 == pairs.index(second)
    for u, v in (first, second):
        edge = graph[u][v]["record"]
        assert edge.osm_way_id == 1264710459
        assert edge.osm_tags["footway"] == "crossing" and not edge.is_closed
    for edge in path_edges(graph, route.node_path):
        assert not edge.is_closed
        assert edge.osm_tags.get("foot") not in DENIED
        assert edge.osm_tags.get("access") not in DENIED or edge.osm_tags.get("foot") in {
            "yes", "designated", "permissive",
        }
        assert edge.osm_tags.get("sidewalk:both") != "separate"
    assert "osm_7045518924" not in route.node_path
    assert route.estimated_time_s == pytest.approx(route.distance_m / 1.25)
    assert route.data_quality.accessibility_incomplete
    assert route.data_quality.last_verified_at is None


@pytest.mark.parametrize("origin,reverse", [(KL_TEAM, False), (NU_TEAM, True)])
def test_other_origins_and_mckl_as_origin(graph, origin, reverse):
    start = snap_coordinate(graph, *origin)[0]
    a, b = (MCKL, start) if reverse else (start, MCKL)
    route = compute_routes(graph, a, b, "fastest", max_results=1)[0]
    assert route.node_path[0] == a and route.node_path[-1] == b
    assert route.geometry[0] == graph.nodes[a]["record"].coordinates
    assert route.geometry[-1] == graph.nodes[b]["record"].coordinates


def test_mckl_http_profiles_and_endpoint_warning(graph):
    app.dependency_overrides[get_graph] = lambda: graph
    try:
        with TestClient(app) as client:
            body = {"origin": {"longitude": NU_TEAM[0], "latitude": NU_TEAM[1]},
                    "destination": {"longitude": 101.6906217, "latitude": 3.1318006},
                    "profile": "fastest"}
            response = client.post("/v1/routes", json=body)
            assert response.status_code == 200
            result = response.json()
            assert result["snapped_endpoints"]["destination"]["node_id"] == MCKL
            assert result["snapped_endpoints"]["origin"]["distance_m"] > 0
            assert any("access gaps" in warning for warning in result["routes"][0]["warnings"])
            profiles = (("safer_at_night", "Insufficient"), ("step_free", "step-free"))
            for profile, message in profiles:
                body["profile"] = profile
                response = client.post("/v1/routes", json=body)
                assert response.status_code == 404
                assert message in response.json()["detail"] and "routes" not in response.json()
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize("tags,connected,avoid", [
    ({"sidewalk:both": "separate"}, True, True),
    ({"sidewalk": "separate"}, True, True),
    ({"sidewalk:left": "separate", "sidewalk:right": "separate"}, True, True),
    ({"sidewalk:both": "separate", "sidewalk:left": "yes"}, True, False),
    ({"sidewalk:left": "separate"}, True, False),
    ({}, True, False),
    ({"sidewalk:both": "separate"}, False, False),
])
def test_general_sidewalk_rule_needs_mapping_and_permitted_connectivity(tags, connected, avoid):
    source = nx.DiGraph()
    source.add_edge("a", "b", record=SimpleNamespace(
        osm_way_id=1, osm_tags={"highway": "secondary", **tags}))
    source.add_edge("a", "s", record=SimpleNamespace(
        osm_way_id=2, osm_tags={"highway": "footway", "footway": "sidewalk"}))
    source.add_edge("s", "b", record=SimpleNamespace(
        osm_way_id=2, osm_tags={"highway": "footway", "footway": "sidewalk"}))
    # This is already profile/access/direction filtered, as supplied by _weighted_graph.
    allowed = nx.DiGraph(source)
    if not connected:
        allowed.remove_edge("s", "b")
    result = _use_separate_sidewalks(allowed, source, "a", "b")
    assert result.has_edge("a", "b") is not avoid
    assert source.has_edge("a", "b")  # No source graph mutation.
    if avoid:
        assert nx.shortest_path(result, "a", "b") == ["a", "s", "b"]
    assert not result.has_edge("b", "a")  # Never invent reverse direction.

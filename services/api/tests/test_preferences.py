import pytest
from fastapi.testclient import TestClient

from services.api.app.api.routes import get_graph
from services.api.app.main import app
from services.api.app.routing.engine import compute_routes, path_edges
from services.api.app.routing.preferences import RoutingPreferences

client = TestClient(app)


def test_explicit_stairs_constraint_is_applied_to_all_returned_paths():
    graph = get_graph()
    routes = compute_routes(
        graph,
        "transit_stop",
        "residential_block",
        "fastest",
        preferences=RoutingPreferences(avoid_stairs=True),
    )
    assert routes[0].estimated_time_s == 600
    assert all(e.stairs is False for r in routes for e in path_edges(graph, r.node_path))


@pytest.mark.parametrize(
    "preferences",
    [
        {"prefer_well_lit": True},
        {"prefer_public_areas": True},
        {"avoid_stairs": True, "avoid_steep_slopes": True},
        {"max_detour_minutes": 0},
    ],
)
def test_supported_preferences_round_trip_http(preferences):
    response = client.post(
        "/v1/routes",
        json={
            "origin": {"node_id": "transit_stop"},
            "destination": {"node_id": "residential_block"},
            "profile": "fastest",
            "preferences": preferences,
        },
    )
    assert response.status_code == 200
    if "max_detour_minutes" in preferences:
        assert all(r["estimated_time_s"] == 480 for r in response.json()["routes"])


def test_constraints_never_relaxed_to_meet_detour():
    response = client.post(
        "/v1/routes",
        json={
            "origin": {"node_id": "transit_stop"},
            "destination": {"node_id": "residential_block"},
            "profile": "fastest",
            "preferences": {"avoid_stairs": True, "max_detour_minutes": 0},
        },
    )
    assert response.status_code == 404


@pytest.mark.parametrize(
    "preferences",
    [
        {"prefer_well_lit": "yes"},
        {"max_detour_minutes": -1},
        {"max_detour_minutes": True},
        {"prefer_covered_paths": True},
    ],
)
def test_invalid_and_unsupported_preferences_rejected(preferences):
    assert (
        client.post(
            "/v1/routes",
            json={
                "origin": {"node_id": "transit_stop"},
                "destination": {"node_id": "residential_block"},
                "profile": "fastest",
                "preferences": preferences,
            },
        ).status_code
        == 422
    )


@pytest.mark.parametrize("field", ["prefer_well_lit", "prefer_public_areas"])
def test_soft_preference_changes_ranked_route(field):
    baseline = compute_routes(get_graph(), "transit_stop", "residential_block", "fastest")
    preferred = compute_routes(get_graph(), "transit_stop", "residential_block", "fastest",
                               preferences=RoutingPreferences(**{field: True}))
    assert baseline[0].estimated_time_s == 480
    assert preferred[0].estimated_time_s == 600
    assert any("lighting" in r.lower() or "public" in r.lower() for r in preferred[0].reasons)

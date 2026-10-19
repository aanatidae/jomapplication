import pytest
from fastapi.testclient import TestClient

from services.api.app.api.routes import get_graph
from services.api.app.main import app

client = TestClient(app)


def payload(profile="fastest", origin="transit_stop", destination="residential_block"):
    return {"origin": {"node_id": origin}, "destination": {"node_id": destination},
            "profile": profile}


@pytest.mark.parametrize("profile,eta", [
    ("fastest", 480), ("safer_at_night", 600), ("step_free", 720),
])
def test_routes_profiles_return_200(profile, eta):
    response = client.post("/v1/routes", json=payload(profile))
    assert response.status_code == 200
    assert response.json()["routes"][0]["estimated_time_s"] == eta


def test_routes_returns_expected_shape_and_deterministic_order():
    first = client.post("/v1/routes", json=payload()).json()
    assert first == client.post("/v1/routes", json=payload()).json()
    assert first["data_kind"] == "SIMULATED_DEMO"
    assert 1 <= len(first["routes"]) <= 3
    for route in first["routes"]:
        assert set(route) == {"id", "profile", "geometry", "distance_m", "estimated_time_s",
                              "total_cost", "reasons", "warnings", "confidence",
                              "verification_summary", "data_quality"}
        assert route["geometry"]["type"] == "LineString"
        assert route["geometry"]["coordinate_system"] == "local_metres_not_geographic"
        assert len(route["geometry"]["coordinates"]) >= 2
        assert route["distance_m"] > 0 and route["estimated_time_s"] > 0
        assert route["reasons"] and route["warnings"] and route["verification_summary"]
        assert route["confidence"]["level"] in {"High", "Medium", "Low"}


def test_invalid_profile_returns_validation_error():
    assert client.post("/v1/routes", json=payload("custom")).status_code == 422


@pytest.mark.parametrize("field", ["origin", "destination"])
def test_unknown_endpoint_returns_clean_error(field):
    body = payload()
    body[field] = {"node_id": "unknown"}
    response = client.post("/v1/routes", json=body)
    assert response.status_code == 404
    assert response.json() == {
        "detail": "Origin or destination is outside the current pilot network."
    }


@pytest.mark.parametrize("profile", ["fastest", "step_free"])
def test_no_route_returns_clean_error(profile):
    response = client.post("/v1/routes", json=payload(profile, "residential_block", "transit_stop"))
    assert response.status_code == 404
    assert "route" in response.json()["detail"]


def test_same_node_returns_validation_error():
    assert client.post("/v1/routes", json=payload(destination="transit_stop")).status_code == 422


def test_coordinates_require_geographic_dataset_and_unimplemented_preferences_are_rejected():
    body = payload()
    body["origin"] = {"latitude": 3, "longitude": 101}
    assert client.post("/v1/routes", json=body).status_code == 422
    body = payload()
    body["preferences"] = {"prefer_covered_paths": True}
    assert client.post("/v1/routes", json=body).status_code == 422


def test_departure_time_requires_timezone():
    body = payload()
    body["departure_time"] = "2026-10-16T20:00:00"
    assert client.post("/v1/routes", json=body).status_code == 422
    body["departure_time"] += "+08:00"
    assert client.post("/v1/routes", json=body).status_code == 200


def test_unexpected_error_is_sanitized(monkeypatch):
    def fail(*args, **kwargs):
        raise RuntimeError("secret internal detail")
    monkeypatch.setattr("services.api.app.api.routes.compute_routes", fail)
    response = client.post("/v1/routes", json=payload())
    assert response.status_code == 500
    assert "secret" not in response.text


def test_search_limit_returns_retryable_error(monkeypatch):
    from services.api.app.routing.errors import SearchLimitError

    def fail(*args, **kwargs):
        raise SearchLimitError("internal budget detail")

    monkeypatch.setattr("services.api.app.api.routes.compute_routes", fail)
    response = client.post("/v1/routes", json=payload())
    assert response.status_code == 503
    assert response.json() == {"detail": "Routing service is temporarily unavailable."}


def test_step_free_does_not_fall_back_to_stairs():
    import networkx as nx
    graph = nx.DiGraph(get_graph())
    for a, b, data in list(graph.edges(data=True)):
        if data["record"].segment_id.startswith("c"):
            graph.remove_edge(a, b)
    # HTTP contract tested with an actual stairs-only graph, not a replacement engine.
    for a, b, data in list(graph.edges(data=True)):
        if data["record"].stairs is not True:
            graph[a][b]["record"] = data["record"].model_copy(update={"stairs": True})
    app.dependency_overrides[get_graph] = lambda: graph
    try:
        response = client.post("/v1/routes", json=payload("step_free"))
        assert response.status_code == 404
        assert "step-free" in response.json()["detail"]
    finally:
        app.dependency_overrides.clear()

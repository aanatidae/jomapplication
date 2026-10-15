from fastapi.testclient import TestClient

from services.api.app.main import app

client = TestClient(app)


def test_dijkstra_selects_lower_time_path_and_returns_geometry():
    response = client.post("/spikes/route", json={})
    assert response.status_code == 200
    result = response.json()
    assert result["dataset"] == "simulated-demo"
    assert result["nodes"] == ["origin", "middle", "destination"]
    assert result["estimated_time_s"] == 120
    assert result["geometry"]["coordinates"] == [
        [101.600, 3.100], [101.601, 3.101], [101.602, 3.100]
    ]
    assert client.post("/spikes/route", json={}).json() == result


def test_unknown_node_returns_clean_error():
    response = client.post("/spikes/route", json={"origin": "missing"})
    assert response.status_code == 404
    assert response.json() == {"detail": "No demo route found"}

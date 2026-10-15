from fastapi.testclient import TestClient

from services.api.app.main import app


def test_health_returns_ready_payload() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

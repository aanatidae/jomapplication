"""Legacy domain/HTTP tests explicitly opt into the deterministic simulated fixture."""

import pytest

from services.api.app.api.routes import get_graph


@pytest.fixture(autouse=True)
def explicit_test_dataset(monkeypatch):
    monkeypatch.setenv("JOM_ROUTING_DATASET", "simulated_demo")
    get_graph.cache_clear()
    yield
    get_graph.cache_clear()

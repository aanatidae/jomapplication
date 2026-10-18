from datetime import timedelta

from services.api.app.routing.engine import compute_routes
from services.api.app.routing.graph_loader import load_graph


def test_quality_uses_actual_sources_and_updates_without_inventing_verification():
    graph = load_graph()
    route = compute_routes(graph, "transit_stop", "residential_block", "fastest")[0]
    assert route.data_quality.sources
    assert route.data_quality.oldest_updated_at is not None
    assert route.data_quality.last_verified_at is None
    assert route.data_quality.missing_update_count == 0


def test_unknown_accessibility_and_stale_quality_are_server_owned():
    graph = load_graph()
    route = compute_routes(graph, "transit_stop", "residential_block", "safer_at_night")[0]
    assert route.data_quality.accessibility_incomplete
    later = graph.graph["reference_time"] + timedelta(days=100)
    stale = compute_routes(graph, "transit_stop", "residential_block", "fastest", as_of=later)[0]
    assert stale.data_quality.stale
    assert stale.confidence.level == "Low"

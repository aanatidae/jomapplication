"""Offline behavioral tests: mutate inputs to prove routing follows data, not route names."""

import json
from copy import deepcopy
from datetime import timedelta

import networkx as nx
import pytest

from services.api.app.routing.confidence import compute_route_confidence
from services.api.app.routing.engine import compute_routes, path_edges
from services.api.app.routing.errors import (
    GraphDataError,
    NoRouteError,
    RoutingInputError,
    SearchLimitError,
)
from services.api.app.routing.graph_loader import DEFAULT_PILOT_PATH, graph_from_json, load_graph
from services.api.app.routing.models import RouteProfile
from services.api.app.routing.profiles import PROFILES, TIME_REFERENCE_S
from services.api.app.routing.scoring import (
    edge_cost,
    is_edge_allowed,
    normalized_penalties,
    safety_penalty,
)


@pytest.fixture
def data():
    return json.loads(DEFAULT_PILOT_PATH.read_text(encoding="utf-8"))


@pytest.fixture
def graph():
    return load_graph()


def build(data):
    return graph_from_json(json.dumps(data))


def best(graph, profile="fastest", **kwargs):
    return compute_routes(graph, "transit_stop", "residential_block", profile, **kwargs)[0]


def test_graph_fixture_loads(graph):
    assert isinstance(graph, nx.DiGraph)
    assert graph.graph["data_kind"] == "SIMULATED_DEMO"
    assert graph.graph["coordinate_system"] == "local_metres_not_geographic"
    assert nx.is_frozen(graph)
    assert len(graph) == 11
    assert graph.number_of_edges() == 14


def test_fastest_profile_prefers_shortest_time(graph):
    result = best(graph)
    assert result.segment_ids == ("a1", "a2")
    assert (result.estimated_time_s, result.distance_m) == (480, 600)
    assert "Shortest travel time" in result.reasons
    assert "Contains stairs" in result.reasons


def test_safer_at_night_prefers_better_lit_route(graph):
    result = best(graph, "safer_at_night")
    assert result.segment_ids == ("b1", "b2", "b3")
    assert (result.estimated_time_s, result.distance_m) == (600, 720)
    assert "+2 min vs fastest" in result.reasons
    assert "Better lighting than fastest" in result.reasons
    assert "Passes active public areas" in result.reasons
    assert "Near a verified staffed security/public point" in result.reasons
    assert result.confidence.level == "Medium"
    assert any("Accessibility information incomplete" in warning for warning in result.warnings)


def test_step_free_excludes_stairs(graph):
    result = best(graph, "step_free")
    assert result.segment_ids == ("c1", "c2", "c3", "c4")
    assert (result.estimated_time_s, result.distance_m) == (720, 830)
    assert all(e.stairs is False for e in path_edges(graph, result.node_path))
    assert "Uses ramp" in result.reasons
    assert "Uses curb cuts" in result.reasons
    assert "Accessible entrance recorded" in result.reasons
    assert "+4 min vs fastest" in result.reasons


@pytest.mark.parametrize("profile", list(RouteProfile))
def test_closed_edge_is_never_used(graph, profile):
    for route in compute_routes(graph, "transit_stop", "residential_block", profile):
        assert "closed_shortcut" not in route.segment_ids
        assert "lift1" not in route.segment_ids


def test_fastest_changes_when_travel_times_change(data):
    for edge in data["edges"]:
        if edge["segment_id"].startswith("b"):
            edge["estimated_time_s"] = 100
    assert best(build(data)).segment_ids == ("b1", "b2", "b3")


def test_night_choice_changes_when_indicators_change(data):
    for edge in data["edges"]:
        if edge["segment_id"].startswith("a"):
            edge.update(
                lighting_score=1,
                crossing_score=1,
                visibility_activity_score=1,
                security_facility_distance_m=0,
            )
        elif edge["segment_id"].startswith("b"):
            edge.update(
                lighting_score=0,
                crossing_score=0,
                visibility_activity_score=0,
                security_facility_verified=False,
            )
    assert best(build(data), "safer_at_night").segment_ids == ("a1", "a2")


def test_tiny_indicator_gain_cannot_create_absurd_detour(data):
    for edge in data["edges"]:
        if edge["segment_id"].startswith("b"):
            edge.update(
                estimated_time_s=2000,
                lighting_score=1,
                visibility_activity_score=1,
                crossing_score=1,
            )
    result = best(build(data), "safer_at_night")
    assert result.estimated_time_s <= 480 * 1.5
    assert not any(segment.startswith("b") for segment in result.segment_ids)


def test_missing_is_not_false(graph):
    missing = graph["transit_stop"]["park_gate"]["record"]
    explicit_null = graph["park_gate"]["residential_block"]["record"]
    absent = graph["transit_stop"]["ramp"]["record"]
    assert missing.stairs is None
    assert explicit_null.stairs is None
    assert absent.stairs is False


def test_unknown_accessibility_reduces_confidence(graph):
    edge = graph["transit_stop"]["ramp"]["record"]
    as_of = graph.graph["reference_time"]
    complete = compute_route_confidence((edge,), as_of)
    unknown = compute_route_confidence((edge.model_copy(update={"stairs": None}),), as_of)
    assert complete.level == "High"
    assert unknown.level == "Medium"
    assert "Accessibility information incomplete on 1 segment(s)" in unknown.factors


@pytest.mark.parametrize(
    "change",
    [
        {"stairs": True},
        {"stairs": None},
        {"slope_percent": None},
        {"slope_percent": 10},
        {"slope_percent": -10},
        {"width_category": "narrow"},
        {"surface_quality": "rough"},
        {"surface_quality": "impassable"},
        {"is_closed": True},
        {"elevator_required": True, "elevator_status": "out_of_service"},
        {"elevator_required": True, "elevator_status": "unknown"},
        {"elevator_required": None},
        {"accessible_entrance": False},
    ],
)
def test_step_free_blockers_are_hard_exclusions(graph, change):
    edge = graph["transit_stop"]["ramp"]["record"].model_copy(update=change)
    assert not is_edge_allowed(edge, PROFILES[RouteProfile.STEP_FREE])


def test_unknown_entrance_is_excluded_only_for_entrance_connections(graph):
    edge = graph["transit_stop"]["ramp"]["record"].model_copy(
        update={"accessible_entrance": None},
    )
    config = PROFILES[RouteProfile.STEP_FREE]
    assert is_edge_allowed(edge, config, entrance=False)
    assert not is_edge_allowed(edge, config, entrance=True)


def test_operational_elevator_is_traversable(graph):
    edge = graph["transit_stop"]["ramp"]["record"].model_copy(
        update={"elevator_required": True, "elevator_status": "operational"},
    )
    assert is_edge_allowed(edge, PROFILES[RouteProfile.STEP_FREE])


def test_step_free_does_not_fall_back_to_unknown_route(data):
    for edge in data["edges"]:
        if edge["segment_id"] == "c1":
            edge["stairs"] = None
    with pytest.raises(NoRouteError, match="constraints"):
        best(build(data), "step_free")


def test_closure_forces_algorithmic_alternative(data):
    for edge in data["edges"]:
        if edge["segment_id"] == "a1":
            edge["is_closed"] = True
    assert best(build(data)).segment_ids == ("b1", "b2", "b3")


def test_well_lit_edge_has_lower_safety_penalty(graph):
    edge = graph["transit_stop"]["stairs_junction"]["record"]
    lit = edge.model_copy(update={"lighting_score": 1})
    as_of = graph.graph["reference_time"]
    assert safety_penalty(lit, as_of) < safety_penalty(edge, as_of)


def test_cost_is_exposure_normalized_and_split_invariant(graph):
    edge = graph["transit_stop"]["community_plaza"]["record"]
    as_of = graph.graph["reference_time"]
    parts = normalized_penalties(edge, as_of)
    assert parts.time == edge.estimated_time_s / TIME_REFERENCE_S
    assert all(0 <= p <= 1 for p in (parts.safety, parts.accessibility, parts.confidence))
    config = PROFILES[RouteProfile.SAFER_AT_NIGHT]
    half = edge.model_copy(update={"estimated_time_s": edge.estimated_time_s / 2})
    assert edge_cost(edge, config, as_of) == pytest.approx(2 * edge_cost(half, config, as_of))


@pytest.mark.parametrize(
    "mutation",
    [
        {"verification_level": "community"},
        {"confidence_score": 0.2},
        {"last_updated_at": None},
        {"lighting_score": None},
        {"security_facility_distance_m": None},
    ],
)
def test_lower_quality_cannot_still_be_high_confidence(graph, mutation):
    edge = graph["transit_stop"]["ramp"]["record"].model_copy(update=mutation)
    assert compute_route_confidence((edge,), graph.graph["reference_time"]).level != "High"


def test_stale_and_future_dates_reduce_confidence(graph):
    edge = graph["transit_stop"]["ramp"]["record"]
    as_of = graph.graph["reference_time"]
    for date in (as_of - timedelta(days=60), as_of + timedelta(days=1)):
        confidence = compute_route_confidence(
            (edge.model_copy(update={"last_updated_at": date}),), as_of
        )
        assert confidence.level == "Low"
        assert "Contains stale, missing or future-dated record updates" in confidence.factors


def test_worst_segment_cannot_be_hidden_by_other_verified_segments(graph):
    edge = graph["transit_stop"]["ramp"]["record"]
    poor = edge.model_copy(update={"confidence_score": 0.1})
    assert (
        compute_route_confidence((poor, *([edge] * 20)), graph.graph["reference_time"]).level
        == "Low"
    )


def test_reasons_match_selected_route_attributes(graph):
    for profile in RouteProfile:
        for route in compute_routes(graph, "transit_stop", "residential_block", profile):
            edges = path_edges(graph, route.node_path)
            assert ("Contains stairs" in route.reasons) == any(e.stairs is True for e in edges)
            assert ("No stairs recorded" in route.reasons) == all(e.stairs is False for e in edges)
            assert ("Uses ramp" in route.reasons) == any(e.ramp is True for e in edges)
            assert not {"Safe", "100% accessible", "Guaranteed secure"}.intersection(route.reasons)
            assert route.data_kind == "SIMULATED_DEMO"
            assert "SIMULATED / DEMO" in route.verification_summary


@pytest.mark.parametrize(
    "change",
    [
        {"security_facility_verified": False},
        {"verification_level": "community"},
        {"security_facility_distance_m": None},
    ],
)
def test_unverified_proximity_cannot_generate_verified_security_reason(data, change):
    for edge in data["edges"]:
        if edge["segment_id"].startswith("b"):
            edge.update(change)
    result = best(build(data), "safer_at_night")
    assert "Near a verified staffed security/public point" not in result.reasons


def test_route_geometry_and_totals_come_from_edges(graph):
    route = best(graph, "step_free")
    edges = path_edges(graph, route.node_path)
    assert route.geometry[0] == graph.nodes[route.node_path[0]]["record"].coordinates
    assert route.geometry[-1] == graph.nodes[route.node_path[-1]]["record"].coordinates
    assert len(route.geometry) == len(edges) + 1
    assert route.distance_m == sum(e.distance_m for e in edges)
    assert route.estimated_time_s == sum(e.estimated_time_s for e in edges)
    assert json.loads(route.model_dump_json())["profile"] == "step_free"


def test_route_results_are_deterministic_under_input_reordering(data):
    expected = [
        r.model_dump_json()
        for r in compute_routes(
            build(data),
            "transit_stop",
            "residential_block",
            "safer_at_night",
        )
    ]
    data["nodes"].reverse()
    data["edges"].reverse()
    for _ in range(3):
        results = compute_routes(build(data), "transit_stop", "residential_block", "safer_at_night")
        assert [r.model_dump_json() for r in results] == expected


def test_equal_cost_ties_use_time_distance_and_stable_segment_ids(data):
    # Equalize A/B/C totals; equal cost/time, B wins distance; A/C then break by segment IDs.
    data["edges"] = [e for e in data["edges"] if e["segment_id"][0] in "abc"]
    for edge in data["edges"]:
        size = {"a": 2, "b": 3, "c": 4}[edge["segment_id"][0]]
        edge["estimated_time_s"] = 1800 / size
        edge["distance_m"] = (500 if edge["segment_id"].startswith("b") else 600) / size
    graph = build(data)
    assert best(graph, max_results=1).segment_ids == ("b1", "b2", "b3")
    results = compute_routes(graph, "transit_stop", "residential_block", "fastest")
    assert len({r.total_cost for r in results}) == 1
    assert [r.segment_ids[0] for r in results] == ["b1", "a1", "c1"]
    data["edges"].reverse()
    data["nodes"].reverse()
    assert best(build(data), max_results=1).segment_ids == ("b1", "b2", "b3")


def test_equal_cost_ties_use_time_before_distance(data):
    # Cost quantization can tie extremely close durations; shorter time must still win.
    data["edges"] = [e for e in data["edges"] if e["segment_id"][0] in "ab"]
    for edge in data["edges"]:
        a = edge["segment_id"].startswith("a")
        edge["estimated_time_s"] = 900 if a else 600 - 1e-9
        edge["distance_m"] = 1 if a else 1000
    graph = build(data)
    results = compute_routes(graph, "transit_stop", "residential_block", "fastest")
    assert len({r.total_cost for r in results}) == 1
    assert best(graph, max_results=1).segment_ids == ("b1", "b2", "b3")


def test_no_route_returns_clear_error(graph):
    with pytest.raises(NoRouteError, match="constraints"):
        compute_routes(graph, "transit_stop", "disconnected_gate", "fastest")


def test_direction_is_explicit(graph):
    with pytest.raises(NoRouteError):
        compute_routes(graph, "residential_block", "transit_stop", "fastest")


@pytest.mark.parametrize(
    "args,kwargs",
    [
        (("missing", "residential_block", "fastest"), {}),
        (("transit_stop", "transit_stop", "fastest"), {}),
        (("transit_stop", "residential_block", "unknown"), {}),
        (("transit_stop", "residential_block", "fastest"), {"max_results": 0}),
        (("transit_stop", "residential_block", "fastest"), {"max_results": True}),
    ],
)
def test_invalid_query_has_domain_error(graph, args, kwargs):
    with pytest.raises(RoutingInputError):
        compute_routes(graph, *args, **kwargs)


def test_naive_reference_time_is_rejected(graph):
    with pytest.raises(RoutingInputError, match="timezone"):
        best(graph, as_of=graph.graph["reference_time"].replace(tzinfo=None))


def test_candidate_budget_is_explicit_error_not_silent_truncation(graph, monkeypatch):
    monkeypatch.setattr("services.api.app.routing.engine.MAX_CANDIDATES", 1)
    with pytest.raises(SearchLimitError, match="no partial ranking"):
        best(graph)


@pytest.mark.parametrize("value", [True, "1", 2])
def test_schema_version_is_an_explicit_supported_integer(data, value):
    data["schema_version"] = value
    with pytest.raises(GraphDataError):
        build(data)


@pytest.mark.parametrize("curb,ramp", [(False, False), (None, False), (False, None)])
def test_crossing_requires_a_known_curb_cut_or_ramp(data, curb, ramp):
    for edge in data["edges"]:
        if edge["segment_id"] == "c2":
            edge.update(curb_cut=curb, ramp=ramp)
    with pytest.raises(NoRouteError):
        best(build(data), "step_free")


def test_crossing_unknown_reduces_confidence_but_ramp_can_establish_transition(graph):
    edge = graph["ramp"]["curb_crossing"]["record"]
    unknown = edge.model_copy(update={"curb_cut": None, "ramp": False})
    as_of = graph.graph["reference_time"]
    kwargs = {"crossing_segments": frozenset([edge.segment_id])}
    assert compute_route_confidence((unknown,), as_of, **kwargs).level == "Medium"
    ramp = unknown.model_copy(update={"ramp": True})
    assert compute_route_confidence((ramp,), as_of, **kwargs).level == "High"
    assert is_edge_allowed(ramp, PROFILES[RouteProfile.STEP_FREE], crossing=True)


def test_stale_security_proximity_never_generates_verified_reason(data):
    for edge in data["edges"]:
        if edge["segment_id"].startswith("b"):
            edge["last_updated_at"] = "2026-07-01T12:00:00Z"
    result = best(build(data), "safer_at_night")
    assert "Near a verified staffed security/public point" not in result.reasons


def test_unknown_lighting_never_generates_better_lighting_reason(data):
    for edge in data["edges"]:
        if edge["segment_id"].startswith("b"):
            edge["lighting_score"] = None
    graph = build(data)
    for result in compute_routes(graph, "transit_stop", "residential_block", "safer_at_night"):
        if result.segment_ids[0] == "b1":
            assert "Better lighting than fastest" not in result.reasons


def test_security_proximity_only_improves_scoring_when_verified(graph):
    edge = graph["community_plaza"]["security_post"]["record"]
    unverified = edge.model_copy(update={"security_facility_verified": False})
    as_of = graph.graph["reference_time"]
    assert safety_penalty(edge, as_of) < safety_penalty(unverified, as_of)


@pytest.mark.parametrize(
    "field,value",
    [
        ("estimated_time_s", 0),
        ("estimated_time_s", -1),
        ("distance_m", "600"),
        ("distance_m", True),
        ("distance_m", float("inf")),
        ("lighting_score", 2),
        ("stairs", "false"),
        ("stairs", 0),
        ("is_closed", None),
        ("width_category", "invented"),
        ("geometry", [[0, 0]]),
        ("last_updated_at", "2026-10-16T12:00:00"),
        ("slope_percent", float("nan")),
    ],
)
def test_malformed_edge_records_are_rejected(data, field, value):
    data["edges"][0][field] = value
    with pytest.raises(GraphDataError, match="Invalid pilot graph"):
        build(data)


@pytest.mark.parametrize(
    "mutation",
    [
        "duplicate_node",
        "duplicate_edge",
        "duplicate_pair",
        "unknown_endpoint",
        "wrong_geometry",
        "self_loop",
        "missing_time",
        "wrong_kind",
        "naive_time",
        "typo",
    ],
)
def test_malformed_graph_topology_and_metadata_are_rejected(data, mutation):
    if mutation == "duplicate_node":
        data["nodes"].append(deepcopy(data["nodes"][0]))
    elif mutation == "duplicate_edge":
        data["edges"].append(deepcopy(data["edges"][0]))
    elif mutation == "duplicate_pair":
        extra = deepcopy(data["edges"][0])
        extra["segment_id"] = "duplicate"
        data["edges"].append(extra)
    elif mutation == "unknown_endpoint":
        data["edges"][0]["end_node"] = "missing"
    elif mutation == "wrong_geometry":
        data["edges"][0]["geometry"] = [[9, 9], [8, 8]]
    elif mutation == "self_loop":
        data["edges"][0]["end_node"] = data["edges"][0]["start_node"]
    elif mutation == "missing_time":
        del data["edges"][0]["estimated_time_s"]
    elif mutation == "wrong_kind":
        data["data_kind"] = "real"
    elif mutation == "naive_time":
        data["reference_time"] = "2026-10-16T12:00:00"
    elif mutation == "typo":
        data["edges"][0]["stair"] = True
    with pytest.raises(GraphDataError):
        build(data)


def test_invalid_json_and_missing_file_are_domain_errors(tmp_path):
    with pytest.raises(GraphDataError):
        graph_from_json("not json")
    with pytest.raises(GraphDataError, match="Cannot read"):
        load_graph(tmp_path / "missing.json")

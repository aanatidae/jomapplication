"""Offline Yen candidate generation with explicit constraints and deterministic ranking."""

from datetime import datetime
from hashlib import sha256
from itertools import pairwise

import networkx as nx

from .confidence import compute_route_confidence, freshness_quality, unknown_accessibility
from .errors import InsufficientSafetyDataError, NoRouteError, RoutingInputError, SearchLimitError
from .explanations import build_route_reasons, verification_summary
from .models import Edge, RouteDataQuality, RouteProfile, RouteResult
from .preferences import (
    DEFAULT_PREFERENCES,
    RoutingPreferences,
    preference_allowed,
    preference_cost,
)
from .profiles import COST_SCALE, MAX_CANDIDATES, PROFILES
from .scoring import edge_cost, is_edge_allowed, verified_security


def path_edges(graph: nx.DiGraph, path: tuple[str, ...]) -> tuple[Edge, ...]:
    return tuple(graph[a][b]["record"] for a, b in pairwise(path))


def _segments_at_kind(graph: nx.DiGraph, kind: str) -> frozenset[str]:
    return frozenset(
        data["record"].segment_id
        for a, b, data in graph.edges(data=True)
        if any(graph.nodes[n]["record"].kind == kind for n in (a, b))
    )


def _weighted_graph(
    graph: nx.DiGraph,
    profile: RouteProfile,
    as_of: datetime,
    entrances: frozenset[str],
    crossings: frozenset[str],
    preferences: RoutingPreferences = DEFAULT_PREFERENCES,
) -> nx.DiGraph:
    weighted = nx.DiGraph()
    weighted.add_nodes_from(sorted(graph.nodes))
    config = PROFILES[profile]
    for a, b, data in sorted(graph.edges(data=True)):
        edge = data["record"]
        entrance = edge.segment_id in entrances
        crossing = edge.segment_id in crossings
        if is_edge_allowed(edge, config, entrance, crossing) and preference_allowed(
            edge, preferences
        ):
            # Integer nanocosts make equal-cost groups exact; result cost is in normalized units.
            units = max(
                1,
                round(
                    (
                        edge_cost(edge, config, as_of, entrance, crossing)
                        + preference_cost(edge, preferences)
                    )
                    * COST_SCALE
                ),
            )
            weighted.add_edge(a, b, cost=units, time=edge.estimated_time_s)
    return weighted


def _ranked_candidates(
    weighted: nx.DiGraph,
    source: nx.DiGraph,
    origin: str,
    destination: str,
    limit: int,
    time_cap: float | None,
) -> list[tuple[str, ...]]:
    candidates = []
    boundary_cost = None
    try:
        if limit == 1 and time_cap is None and source.graph.get("data_kind") == "OPENSTREETMAP":
            # The geographic baseline needs one shortest path, not Yen's next alternative.
            # Canonical weighted-graph insertion keeps equal-cost traversal reproducible.
            return [tuple(nx.shortest_path(weighted, origin, destination, weight="cost"))]
        paths = nx.shortest_simple_paths(weighted, origin, destination, weight="cost")
        for examined, nodes in enumerate(paths, start=1):
            path = tuple(nodes)
            cost = sum(weighted[a][b]["cost"] for a, b in pairwise(path))
            if boundary_cost is not None and cost > boundary_cost:
                break
            if examined > MAX_CANDIDATES:
                raise SearchLimitError(
                    "Pilot candidate budget exceeded; no partial ranking returned"
                )
            edges = path_edges(source, path)
            time = sum(e.estimated_time_s for e in edges)
            if time_cap is not None and time > time_cap:
                continue
            key = (cost, time, sum(e.distance_m for e in edges), tuple(e.segment_id for e in edges))
            candidates.append((key, path))
            if len(candidates) >= limit:
                # Examine the entire boundary cost group, including ties beyond the requested K.
                boundary_cost = cost
    except nx.NetworkXNoPath as error:
        raise NoRouteError("No route satisfies the profile's traversal constraints") from error
    if not candidates:
        raise NoRouteError(
            "No route satisfies the profile's traversal constraints and detour limit"
        )
    return [path for _, path in sorted(candidates)[:limit]]


def _use_separate_sidewalks(
    weighted: nx.DiGraph, source: nx.DiGraph, origin: str, destination: str
) -> nx.DiGraph:
    """Avoid mapped carriageways only when a permitted connected alternative exists.

    Keep a carriageway needed to reach an endpoint or disconnected sidepath. The
    profile-filtered graph supplies access, closure, direction and preference rules;
    neither source topology nor OSM geometry is changed.
    """
    carriageways: dict[int, set[tuple[str, str]]] = {}
    for a, b in weighted.edges:
        edge = source[a][b]["record"]
        tags = edge.osm_tags
        both = tags.get("sidewalk:both", tags.get("sidewalk"))
        if (
            edge.osm_way_id is not None
            and tags.get("highway") in {
                "primary", "primary_link", "secondary", "secondary_link",
                "tertiary", "tertiary_link", "unclassified", "residential",
                "living_street", "service", "road",
            }
            and tags.get("sidewalk:left", both) == "separate"
            and tags.get("sidewalk:right", both) == "separate"
        ):
            carriageways.setdefault(edge.osm_way_id, set()).add((a, b))
    avoided: set[tuple[str, str]] = set()
    for way in sorted(carriageways):
        blocked = avoided | carriageways[way]
        alternative = nx.subgraph_view(
            weighted, filter_edge=lambda a, b, blocked=blocked: (a, b) not in blocked
        )
        if nx.has_path(alternative, origin, destination):
            avoided = blocked
    return nx.subgraph_view(weighted, filter_edge=lambda a, b: (a, b) not in avoided)


def compute_routes(
    graph: nx.DiGraph,
    origin: str,
    destination: str,
    profile: RouteProfile | str,
    *,
    max_results: int = 3,
    as_of: datetime | None = None,
    preferences: RoutingPreferences = DEFAULT_PREFERENCES,
) -> tuple[RouteResult, ...]:
    """Accept a loader-produced graph. Demo time defaults to the dataset's fixed reference."""
    if origin not in graph or destination not in graph or origin == destination:
        raise RoutingInputError("Use two different, known pilot node identifiers")
    if (
        isinstance(max_results, bool)
        or not isinstance(max_results, int)
        or not 1 <= max_results <= 3
    ):
        raise RoutingInputError("max_results must be an integer from 1 to 3")
    try:
        profile = RouteProfile(profile)
    except ValueError as error:
        raise RoutingInputError("Unknown routing profile") from error
    as_of = as_of if as_of is not None else graph.graph["reference_time"]
    if as_of.utcoffset() is None:
        raise RoutingInputError("as_of must have a timezone")
    entrances = _segments_at_kind(graph, "entrance")
    crossings = _segments_at_kind(graph, "crossing")
    fastest_graph = _weighted_graph(graph, RouteProfile.FASTEST, as_of, entrances, crossings)
    fastest_graph = _use_separate_sidewalks(fastest_graph, graph, origin, destination)
    baseline_path = _ranked_candidates(fastest_graph, graph, origin, destination, 1, None)[0]
    baseline = path_edges(graph, baseline_path)
    config = PROFILES[profile]
    cap = (
        sum(e.estimated_time_s for e in baseline) * config.max_time_ratio
        if config.max_time_ratio is not None
        else None
    )
    if preferences.max_detour_minutes is not None:
        preference_cap = (
            sum(e.estimated_time_s for e in baseline) + preferences.max_detour_minutes * 60
        )
        cap = min(cap, preference_cap) if cap is not None else preference_cap
    weighted = (
        fastest_graph
        if profile == RouteProfile.FASTEST and preferences == DEFAULT_PREFERENCES
        else _weighted_graph(graph, profile, as_of, entrances, crossings, preferences)
    )
    if weighted is not fastest_graph:
        weighted = _use_separate_sidewalks(weighted, graph, origin, destination)
    paths = _ranked_candidates(weighted, graph, origin, destination, max_results, cap)
    if profile == RouteProfile.SAFER_AT_NIGHT and not any(
        any(value is not None for value in (
            edge.lighting_score, edge.crossing_score, edge.visibility_activity_score
        )) or verified_security(edge, as_of)
        for path in paths for edge in path_edges(graph, path)
    ):
        raise InsufficientSafetyDataError(
            "Insufficient lighting, crossing and activity information to recommend a safer night "
            "route. Choose Fastest to view an ordinary walking route."
        )
    return tuple(
        _result(graph, weighted, path, profile, baseline, as_of, entrances, crossings)
        for path in paths
    )


def _result(
    graph: nx.DiGraph,
    weighted: nx.DiGraph,
    path: tuple[str, ...],
    profile: RouteProfile,
    baseline: tuple[Edge, ...],
    as_of: datetime,
    entrances: frozenset[str],
    crossings: frozenset[str],
) -> RouteResult:
    edges = path_edges(graph, path)
    confidence = compute_route_confidence(edges, as_of, entrances, crossings)
    ids = tuple(e.segment_id for e in edges)
    digest = sha256(f"{graph.graph['dataset_id']}|{profile}|{','.join(ids)}".encode()).hexdigest()[
        :16
    ]
    geometry = edges[0].geometry + tuple(point for e in edges[1:] for point in e.geometry[1:])
    geographic = graph.graph["data_kind"] == "OPENSTREETMAP"
    warnings = [
        "OpenStreetMap pedestrian mapping; incomplete and not field verified."
        if geographic
        else "SIMULATED / DEMO graph; not for navigation or real-world safety claims.",
        "Environmental indicators are not guarantees; conditions may change.",
        *confidence.factors,
    ]
    if profile == RouteProfile.STEP_FREE:
        warnings.append("Step-free based on recorded attributes; not an accessibility guarantee.")
    if geographic:
        warnings.extend(
            [
                "Route starts and ends on snapped network nodes. Access from your chosen point is "
                "not mapped or included in the distance; check the marked endpoints.",
                "Lighting, activity, crossings and staffed security are not independently "
                "verified. "
                "A night recommendation is unavailable without environmental evidence.",
                "Walking time is an estimate at 1.25 m/s, without traffic, signals "
                "or indoor navigation.",
            ]
        )
    return RouteResult(
        id=f"{profile}-{digest}",
        dataset_id=graph.graph["dataset_id"],
        data_kind=graph.graph["data_kind"],
        profile=profile,
        node_path=path,
        segment_ids=ids,
        geometry=geometry,
        distance_m=sum(e.distance_m for e in edges),
        estimated_time_s=sum(e.estimated_time_s for e in edges),
        total_cost=sum(weighted[a][b]["cost"] for a, b in pairwise(path)) / COST_SCALE,
        reasons=build_route_reasons(edges, baseline, as_of, entrances),
        warnings=tuple(warnings),
        confidence=confidence,
        verification_summary=verification_summary(edges, geographic=geographic),
        data_quality=RouteDataQuality(
            sources=tuple(sorted({e.source for e in edges})),
            oldest_updated_at=min(
                (e.last_updated_at for e in edges if e.last_updated_at is not None),
                default=None,
            ),
            missing_update_count=sum(e.last_updated_at is None for e in edges),
            accessibility_incomplete=any(
                unknown_accessibility(e, e.segment_id in entrances, e.segment_id in crossings)
                for e in edges
            ),
            stale=any(freshness_quality(e, as_of) <= 0.25 for e in edges),
        ),
    )

"""Reasons derived only from selected edges and an actual fastest baseline."""

from datetime import datetime

from .models import Edge
from .profiles import NEAR_SECURITY_M
from .scoring import verified_security


def weighted_indicator(edges: tuple[Edge, ...], field: str) -> float | None:
    if any(getattr(edge, field) is None for edge in edges):
        return None
    return sum(getattr(edge, field) * edge.estimated_time_s for edge in edges) / sum(
        edge.estimated_time_s for edge in edges
    )


def build_route_reasons(
    edges: tuple[Edge, ...],
    baseline: tuple[Edge, ...],
    as_of: datetime,
    entrance_segments: frozenset[str] = frozenset(),
) -> tuple[str, ...]:
    reasons = []
    seconds = sum(e.estimated_time_s for e in edges)
    baseline_seconds = sum(e.estimated_time_s for e in baseline)
    difference = seconds - baseline_seconds
    if difference == 0:
        reasons.append("Shortest travel time")
    elif difference > 0:
        reasons.append(f"+{difference / 60:g} min vs fastest")
    lighting = weighted_indicator(edges, "lighting_score")
    baseline_lighting = weighted_indicator(baseline, "lighting_score")
    if lighting is not None and baseline_lighting is not None and lighting > baseline_lighting:
        reasons.append("Better lighting than fastest")
    activity = weighted_indicator(edges, "visibility_activity_score")
    if activity is not None and activity >= 0.7:
        reasons.append("Passes active public areas")
    if any(
        verified_security(e, as_of) and e.security_facility_distance_m <= NEAR_SECURITY_M
        for e in edges
    ):
        reasons.append("Near a verified staffed security/public point")
    if all(e.stairs is False for e in edges):
        reasons.append("No stairs recorded")
        if any(e.stairs is True for e in baseline):
            reasons.append("Avoids staircase on fastest route")
    elif any(e.stairs is True for e in edges):
        reasons.append("Contains stairs")
    if any(e.ramp is True for e in edges):
        reasons.append("Uses ramp")
    if any(e.curb_cut is True for e in edges):
        reasons.append("Uses curb cuts")
    entrances = [e for e in edges if e.segment_id in entrance_segments]
    if entrances and all(e.accessible_entrance is True for e in entrances):
        reasons.append("Accessible entrance recorded")
    return tuple(reasons)


def verification_summary(edges: tuple[Edge, ...]) -> str:
    counts: dict[str, int] = {}
    for edge in edges:
        counts[edge.verification_level] = counts.get(edge.verification_level, 0) + 1
    sources = ", ".join(sorted({e.source for e in edges}))
    levels = ", ".join(f"{level}: {count}" for level, count in sorted(counts.items()))
    dates = [e.last_updated_at for e in edges if e.last_updated_at is not None]
    oldest = min(dates).isoformat() if dates else "unknown"
    missing = len(edges) - len(dates)
    return (
        f"SIMULATED / DEMO only; {levels}; sources: {sources}; "
        f"oldest known update: {oldest}; missing timestamps: {missing}"
    )

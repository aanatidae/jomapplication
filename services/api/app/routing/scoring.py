"""Normalized, exposure-weighted edge costs; splitting an edge does not change its risk."""

from dataclasses import dataclass
from datetime import datetime
from statistics import mean

from .confidence import edge_quality, freshness_quality, unknown_accessibility
from .models import Edge
from .profiles import (
    MAX_SLOPE_PERCENT,
    SECURITY_REFERENCE_M,
    TIME_REFERENCE_S,
    UNKNOWN_PENALTY,
    ProfileConfig,
)


def is_edge_allowed(
    edge: Edge,
    profile: ProfileConfig,
    entrance: bool = False,
    crossing: bool = False,
) -> bool:
    if edge.is_closed or edge.surface_quality == "impassable":
        return False
    if edge.elevator_required is True and edge.elevator_status != "operational":
        return False
    if not profile.require_step_free:
        return True
    if unknown_accessibility(edge, entrance, crossing):
        return False
    if crossing and edge.curb_cut is not True and edge.ramp is not True:
        return False
    return not (
        edge.stairs is True
        or abs(edge.slope_percent) > MAX_SLOPE_PERCENT
        or edge.width_category == "narrow"
        or edge.surface_quality == "rough"
        or edge.accessible_entrance is False
    )


def verified_security(edge: Edge, as_of: datetime) -> bool:
    return (
        edge.security_facility_verified is True
        and edge.security_facility_distance_m is not None
        and edge.verification_level in ("confirmed", "venue_verified")
        and freshness_quality(edge, as_of) >= 0.75
    )


def safety_penalty(edge: Edge, as_of: datetime) -> float:
    risks = [
        UNKNOWN_PENALTY if value is None else 1 - value
        for value in (edge.lighting_score, edge.crossing_score, edge.visibility_activity_score)
    ]
    proximity = UNKNOWN_PENALTY
    if verified_security(edge, as_of):
        proximity = min(edge.security_facility_distance_m / SECURITY_REFERENCE_M, 1.0)
    return mean([*risks, proximity])


def accessibility_penalty(edge: Edge, entrance: bool = False, crossing: bool = False) -> float:
    if unknown_accessibility(edge, entrance, crossing):
        return UNKNOWN_PENALTY
    return mean(
        [
            float(edge.stairs),
            min(abs(edge.slope_percent) / MAX_SLOPE_PERCENT, 1.0),
            {"wide": 0.0, "standard": 0.2, "narrow": 1.0}[edge.width_category],
            {"smooth": 0.0, "firm": 0.2, "rough": 0.8, "impassable": 1.0}[edge.surface_quality],
        ]
    )


@dataclass(frozen=True)
class Penalties:
    time: float
    safety: float
    accessibility: float
    confidence: float


def normalized_penalties(
    edge: Edge,
    as_of: datetime,
    entrance: bool = False,
    crossing: bool = False,
) -> Penalties:
    return Penalties(
        time=edge.estimated_time_s / TIME_REFERENCE_S,
        safety=safety_penalty(edge, as_of),
        accessibility=accessibility_penalty(edge, entrance, crossing),
        confidence=1 - edge_quality(edge, as_of, entrance, crossing),
    )


def edge_cost(
    edge: Edge,
    profile: ProfileConfig,
    as_of: datetime,
    entrance: bool = False,
    crossing: bool = False,
) -> float:
    penalties = normalized_penalties(edge, as_of, entrance, crossing)
    return penalties.time * (
        profile.time
        + profile.safety * penalties.safety
        + profile.accessibility * penalties.accessibility
        + profile.confidence * penalties.confidence
    )

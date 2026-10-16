"""Data quality only. These categories never predict a person's safety."""

from datetime import datetime
from statistics import mean

from .models import Edge, RouteConfidence
from .profiles import RECENT_AFTER_DAYS, STALE_AFTER_DAYS, VERIFICATION_QUALITY

ACCESS_FIELDS = (
    "stairs",
    "slope_percent",
    "width_category",
    "surface_quality",
    "elevator_required",
)
ENVIRONMENT_FIELDS = (
    "lighting_score",
    "crossing_score",
    "visibility_activity_score",
    "security_facility_distance_m",
    "security_facility_verified",
)
HIGH_THRESHOLD = 0.8
MEDIUM_THRESHOLD = 0.5
INCOMPLETE_CAP = 0.65
STALE_CAP = 0.45


def unknown_accessibility(edge: Edge, entrance: bool = False, crossing: bool = False) -> bool:
    return (
        any(getattr(edge, field) is None for field in ACCESS_FIELDS)
        or (entrance and edge.accessible_entrance is None)
        or (edge.elevator_required is True and edge.elevator_status in (None, "unknown"))
        or (
            crossing
            and edge.curb_cut is not True
            and edge.ramp is not True
            and (edge.curb_cut is None or edge.ramp is None)
        )
    )


def freshness_quality(edge: Edge, as_of: datetime) -> float:
    if edge.last_updated_at is None or edge.last_updated_at > as_of:
        return 0.0
    age = (as_of - edge.last_updated_at).total_seconds() / 86_400
    if age > STALE_AFTER_DAYS:
        return 0.25
    return 1.0 if age <= RECENT_AFTER_DAYS else 0.75


def edge_quality(
    edge: Edge,
    as_of: datetime,
    entrance: bool = False,
    crossing: bool = False,
) -> float:
    completeness = mean([getattr(edge, key) is not None for key in ENVIRONMENT_FIELDS])
    quality = mean(
        [
            edge.confidence_score if edge.confidence_score is not None else 0.0,
            VERIFICATION_QUALITY[edge.verification_level],
            freshness_quality(edge, as_of),
            completeness,
            0.0 if unknown_accessibility(edge, entrance, crossing) else 1.0,
        ]
    )
    if edge.confidence_score is not None:
        quality = min(quality, edge.confidence_score)
    # Caps prevent a single missing critical field or unverified source being averaged away.
    if unknown_accessibility(edge, entrance, crossing) or edge.verification_level in (
        "community",
        "unverified",
    ):
        quality = min(quality, INCOMPLETE_CAP)
    if freshness_quality(edge, as_of) <= 0.25:
        quality = min(quality, STALE_CAP)
    if completeness < 1 or edge.confidence_score is None:
        quality = min(quality, INCOMPLETE_CAP)
    return quality


def compute_route_confidence(
    edges: tuple[Edge, ...],
    as_of: datetime,
    entrance_segments: frozenset[str] = frozenset(),
    crossing_segments: frozenset[str] = frozenset(),
) -> RouteConfidence:
    qualities = [
        edge_quality(e, as_of, e.segment_id in entrance_segments, e.segment_id in crossing_segments)
        for e in edges
    ]
    # Weakest segment controls the category; a long verified stretch cannot hide a weak crossing.
    quality = min(qualities)
    factors = []
    unknown = sum(
        unknown_accessibility(
            e, e.segment_id in entrance_segments, e.segment_id in crossing_segments
        )
        for e in edges
    )
    if unknown:
        factors.append(f"Accessibility information incomplete on {unknown} segment(s)")
    if any(e.verification_level in ("community", "unverified") for e in edges):
        factors.append("Contains community-only or unverified data")
    if any(freshness_quality(e, as_of) <= 0.25 for e in edges):
        factors.append("Contains stale, missing or future-dated verification")
    if any(any(getattr(e, key) is None for key in ENVIRONMENT_FIELDS) for e in edges):
        factors.append("Environmental indicators incomplete")
    if any(e.confidence_score is None for e in edges):
        factors.append("Source confidence missing")
    if any(e.confidence_score is not None and e.confidence_score < MEDIUM_THRESHOLD for e in edges):
        factors.append("Contains low-confidence source data")
    return RouteConfidence(
        level="High"
        if quality >= HIGH_THRESHOLD
        else "Medium"
        if quality >= MEDIUM_THRESHOLD
        else "Low",
        factors=tuple(factors),
        as_of=as_of,
    )

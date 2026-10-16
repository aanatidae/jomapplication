"""Explicit needs layered on existing profiles; no client-side scoring."""

from dataclasses import dataclass

from .models import Edge
from .profiles import MAX_SLOPE_PERCENT, TIME_REFERENCE_S, UNKNOWN_PENALTY

PREFERENCE_WEIGHT = 2.0


@dataclass(frozen=True)
class RoutingPreferences:
    prefer_well_lit: bool = False
    avoid_stairs: bool = False
    avoid_steep_slopes: bool = False
    prefer_public_areas: bool = False
    max_detour_minutes: int | None = None


DEFAULT_PREFERENCES = RoutingPreferences()


def preference_allowed(edge: Edge, preferences: RoutingPreferences) -> bool:
    # Unknown traversal data cannot satisfy an explicit hard constraint.
    if preferences.avoid_stairs and edge.stairs is not False:
        return False
    return not (
        preferences.avoid_steep_slopes
        and (edge.slope_percent is None or abs(edge.slope_percent) > MAX_SLOPE_PERCENT)
    )


def preference_cost(edge: Edge, preferences: RoutingPreferences) -> float:
    penalty = 0.0
    for enabled, value in (
        (preferences.prefer_well_lit, edge.lighting_score),
        (preferences.prefer_public_areas, edge.visibility_activity_score),
    ):
        if enabled:
            penalty += UNKNOWN_PENALTY if value is None else 1 - value
    return edge.estimated_time_s / TIME_REFERENCE_S * PREFERENCE_WEIGHT * penalty

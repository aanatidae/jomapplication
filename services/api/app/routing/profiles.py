"""Hackathon demonstration settings, not scientific or regulatory thresholds."""

from dataclasses import dataclass
from types import MappingProxyType

from .models import RouteProfile

TIME_REFERENCE_S = 600.0
SECURITY_REFERENCE_M = 300.0
MAX_SLOPE_PERCENT = 8.33
STALE_AFTER_DAYS = 30
RECENT_AFTER_DAYS = 7
NEAR_SECURITY_M = 100
COST_SCALE = 1_000_000_000
MAX_CANDIDATES = 2_000
UNKNOWN_PENALTY = 0.75
VERIFICATION_QUALITY = MappingProxyType(
    {
        "unverified": 0.25,
        "community": 0.45,
        "confirmed": 0.7,
        "venue_verified": 1.0,
    }
)


@dataclass(frozen=True)
class ProfileConfig:
    time: float
    safety: float
    accessibility: float
    confidence: float
    require_step_free: bool = False
    max_time_ratio: float | None = None


PROFILES = MappingProxyType(
    {
        RouteProfile.FASTEST: ProfileConfig(1.0, 0.0, 0.0, 0.0),
        RouteProfile.SAFER_AT_NIGHT: ProfileConfig(1.0, 2.0, 0.0, 0.4, max_time_ratio=1.5),
        RouteProfile.STEP_FREE: ProfileConfig(1.0, 0.1, 0.5, 0.5, require_step_free=True),
    }
)

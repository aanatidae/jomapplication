"""Public HTTP contract; domain explanations and confidence are reused unchanged."""

from datetime import datetime
from typing import Annotated, Literal

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field

from ..routing.models import Coordinate, Identifier, RouteConfidence, RouteProfile


class ApiModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RoutePoint(ApiModel):
    node_id: Identifier


class RoutePreferences(ApiModel):
    prefer_well_lit: bool = Field(default=False, strict=True)
    avoid_stairs: bool = Field(default=False, strict=True)
    avoid_steep_slopes: bool = Field(default=False, strict=True)
    prefer_public_areas: bool = Field(default=False, strict=True)
    prefer_covered_paths: Literal[None] = None
    max_detour_minutes: int | None = Field(default=None, ge=0, le=60, strict=True)


class RouteRequest(ApiModel):
    origin: RoutePoint
    destination: RoutePoint
    profile: RouteProfile
    departure_time: AwareDatetime | None = None
    preferences: RoutePreferences | None = None


class RouteGeometry(ApiModel):
    type: Literal["LineString"] = "LineString"
    coordinate_system: Literal["local_metres_not_geographic"] = "local_metres_not_geographic"
    coordinates: Annotated[tuple[Coordinate, ...], Field(min_length=2)]


class RouteOption(ApiModel):
    id: str
    profile: RouteProfile
    geometry: RouteGeometry
    distance_m: float
    estimated_time_s: float
    total_cost: float
    reasons: tuple[str, ...]
    warnings: tuple[str, ...]
    confidence: RouteConfidence
    verification_summary: str


class RouteResponse(ApiModel):
    dataset_id: str
    data_kind: Literal["SIMULATED_DEMO"] = "SIMULATED_DEMO"
    reference_time: datetime
    routes: Annotated[tuple[RouteOption, ...], Field(min_length=1, max_length=3)]

"""Validated pilot records and internal results, independent of HTTP contracts."""

from datetime import datetime
from enum import StrEnum
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, FiniteFloat, field_validator, model_validator

Score = Annotated[FiniteFloat, Field(ge=0, le=1)]
Positive = Annotated[FiniteFloat, Field(gt=0)]
Nonnegative = Annotated[FiniteFloat, Field(ge=0)]
Coordinate = tuple[FiniteFloat, FiniteFloat]
Identifier = Annotated[str, Field(min_length=1, pattern=r"^[a-z0-9_-]+$")]
Verification = Literal["unverified", "community", "confirmed", "venue_verified"]


class RouteProfile(StrEnum):
    FASTEST = "fastest"
    SAFER_AT_NIGHT = "safer_at_night"
    STEP_FREE = "step_free"


class Record(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True, frozen=True)


class Node(Record):
    id: Identifier
    name: Annotated[str, Field(min_length=1)]
    kind: Literal[
        "transit",
        "intersection",
        "crossing",
        "entrance",
        "ramp",
        "elevator",
        "plaza",
        "park",
        "security",
        "residential",
    ]
    coordinates: Coordinate


class Edge(Record):
    segment_id: Identifier
    start_node: Identifier
    end_node: Identifier
    geometry: Annotated[tuple[Coordinate, ...], Field(min_length=2)]
    distance_m: Positive
    estimated_time_s: Positive
    lighting_score: Score | None = None
    crossing_score: Score | None = None
    visibility_activity_score: Score | None = None
    security_facility_distance_m: Nonnegative | None = None
    security_facility_verified: bool | None = None
    stairs: bool | None = None
    ramp: bool | None = None
    curb_cut: bool | None = None
    slope_percent: FiniteFloat | None = None
    width_category: Literal["narrow", "standard", "wide"] | None = None
    surface_quality: Literal["smooth", "firm", "rough", "impassable"] | None = None
    elevator_required: bool | None = None
    elevator_status: Literal["operational", "out_of_service", "unknown"] | None = None
    accessible_entrance: bool | None = None
    is_closed: bool
    source: Annotated[str, Field(min_length=1)]
    verification_level: Verification
    confidence_score: Score | None = None
    last_updated_at: datetime | None = None

    @field_validator("last_updated_at")
    @classmethod
    def aware_time(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.utcoffset() is None:
            raise ValueError("last_updated_at must have a timezone")
        return value


class PilotData(Record):
    schema_version: Literal[1]
    dataset_id: Identifier
    data_kind: Literal["SIMULATED_DEMO"]
    description: Annotated[str, Field(min_length=1)]
    coordinate_system: Literal["local_metres_not_geographic"]
    reference_time: datetime
    demo_origin: Identifier
    demo_destination: Identifier
    nodes: Annotated[tuple[Node, ...], Field(min_length=2)]
    edges: Annotated[tuple[Edge, ...], Field(min_length=1)]

    @field_validator("schema_version", mode="before")
    @classmethod
    def integer_version(cls, value: object) -> object:
        if type(value) is not int:
            raise ValueError("schema_version must be an integer")
        return value

    @field_validator("reference_time")
    @classmethod
    def aware_reference(cls, value: datetime) -> datetime:
        if value.utcoffset() is None:
            raise ValueError("reference_time must have a timezone")
        return value

    @model_validator(mode="after")
    def valid_topology(self) -> "PilotData":
        nodes = {node.id: node for node in self.nodes}
        if len(nodes) != len(self.nodes):
            raise ValueError("Duplicate node identifier")
        if self.demo_origin not in nodes or self.demo_destination not in nodes:
            raise ValueError("Unknown demo endpoint")
        segments: set[str] = set()
        pairs: set[tuple[str, str]] = set()
        for edge in self.edges:
            pair = (edge.start_node, edge.end_node)
            if edge.segment_id in segments or pair in pairs:
                raise ValueError("Duplicate segment or directed node pair")
            segments.add(edge.segment_id)
            pairs.add(pair)
            if edge.start_node == edge.end_node or any(node not in nodes for node in pair):
                raise ValueError("Self-loop or unknown endpoint")
            if (
                edge.geometry[0] != nodes[edge.start_node].coordinates
                or edge.geometry[-1] != nodes[edge.end_node].coordinates
            ):
                raise ValueError("Geometry must follow start/end node coordinates")
        return self


class RouteConfidence(Record):
    level: Literal["High", "Medium", "Low"]
    factors: tuple[str, ...]
    as_of: datetime


class RouteDataQuality(Record):
    sources: tuple[str, ...]
    oldest_updated_at: datetime | None
    missing_update_count: int
    accessibility_incomplete: bool
    stale: bool
    # Update timestamps are not verification timestamps. No such evidence exists yet.
    last_verified_at: datetime | None = None


class RouteResult(Record):
    id: str
    dataset_id: str
    data_kind: Literal["SIMULATED_DEMO"] = "SIMULATED_DEMO"
    profile: RouteProfile
    node_path: tuple[str, ...]
    segment_ids: tuple[str, ...]
    geometry: tuple[Coordinate, ...]
    distance_m: float
    estimated_time_s: float
    total_cost: float
    reasons: tuple[str, ...]
    warnings: tuple[str, ...]
    confidence: RouteConfidence
    verification_summary: str
    data_quality: RouteDataQuality

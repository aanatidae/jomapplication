"""Thin HTTP adapter around the Phase 3 engine."""

import logging
import os
from datetime import UTC, datetime
from functools import lru_cache
from typing import Annotated

import networkx as nx
from fastapi import APIRouter, Depends, HTTPException

from ..models.routes import RouteGeometry, RouteOption, RouteRequest, RouteResponse
from ..routing.engine import compute_routes
from ..routing.errors import NoRouteError, RoutingInputError, SearchLimitError
from ..routing.geography import snap_coordinate
from ..routing.graph_loader import load_graph
from ..routing.osm_import import load_osm_graph
from ..routing.preferences import RoutingPreferences

router = APIRouter()
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_graph() -> nx.DiGraph:
    try:
        return (
            load_graph()
            if os.getenv("JOM_ROUTING_DATASET") == "simulated_demo"
            else load_osm_graph()
        )
    except (OSError, ValueError) as error:
        logger.exception("Pedestrian graph cache unavailable")
        raise HTTPException(
            503, "Pedestrian map data unavailable. Please try again later."
        ) from error


@router.post("/v1/routes", response_model=RouteResponse)
def routes(
    request: RouteRequest, graph: Annotated[nx.DiGraph, Depends(get_graph)]
) -> RouteResponse:
    snapped = {}
    endpoints = []
    for label, point in (("origin", request.origin), ("destination", request.destination)):
        node = point.node_id
        separation = 0.0
        if node is None:
            if graph.graph["coordinate_system"] != "WGS84":
                raise HTTPException(422, "Coordinates require the geographic pilot dataset.")
            try:
                node, separation = snap_coordinate(graph, point.longitude, point.latitude)
            except RoutingInputError as error:
                raise HTTPException(404, str(error)) from error
        endpoints.append(node)
        if node in graph:
            snapped[label] = {
                "node_id": node,
                "coordinates": graph.nodes[node]["record"].coordinates,
                "distance_m": round(separation, 2),
            }
    origin, destination = endpoints
    if origin not in graph or destination not in graph:
        raise HTTPException(404, "Origin or destination is outside the current pilot network.")
    if origin == destination:
        raise HTTPException(422, "Choose different origin and destination nodes.")
    try:
        # Departure is metadata, not field verification. Real data uses today's quality
        # clock; the explicitly selected demo fixture retains its fixed assessment time.
        preferences = (
            RoutingPreferences(**request.preferences.model_dump(exclude={"prefer_covered_paths"}))
            if request.preferences
            else RoutingPreferences()
        )
        results = compute_routes(
            graph,
            origin,
            destination,
            request.profile,
            preferences=preferences,
            as_of=datetime.now(UTC) if graph.graph["data_kind"] == "OPENSTREETMAP" else None,
        )
        return RouteResponse(
            dataset_id=graph.graph["dataset_id"],
            data_kind=graph.graph["data_kind"],
            reference_time=graph.graph["reference_time"],
            snapped_endpoints=snapped if graph.graph["data_kind"] == "OPENSTREETMAP" else None,
            routes=tuple(
                RouteOption(
                    **result.model_dump(
                        exclude={"geometry", "node_path", "segment_ids", "dataset_id", "data_kind",
                                 "warnings"}
                    ),
                    warnings=result.warnings + ((
                        f"Start snapped {snapped['origin']['distance_m']:g} m; "
                        f"destination snapped {snapped['destination']['distance_m']:g} m. "
                        "These access gaps are not included in the mapped route.",
                    ) if graph.graph["data_kind"] == "OPENSTREETMAP" else ()),
                    geometry=RouteGeometry(
                        coordinates=result.geometry,
                        coordinate_system=graph.graph["coordinate_system"],
                    ),
                )
                for result in results
            ),
        )
    except NoRouteError as error:
        detail = (
            "No verified step-free route is available for this trip."
            if request.profile == "step_free"
            else "No route is available for the selected profile."
        )
        raise HTTPException(404, detail) from error
    except RoutingInputError as error:
        raise HTTPException(422, "Invalid pilot route request.") from error
    except SearchLimitError as error:
        logger.exception("Pilot routing search limit reached")
        raise HTTPException(503, "Routing service is temporarily unavailable.") from error
    except Exception as error:
        logger.exception("Unexpected route calculation failure")
        raise HTTPException(500, "Couldn't calculate routes. Please try again.") from error

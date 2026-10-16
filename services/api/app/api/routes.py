"""Thin HTTP adapter around the Phase 3 engine."""

import logging
from functools import lru_cache
from typing import Annotated

import networkx as nx
from fastapi import APIRouter, Depends, HTTPException

from ..models.routes import RouteGeometry, RouteOption, RouteRequest, RouteResponse
from ..routing.engine import compute_routes
from ..routing.errors import NoRouteError, RoutingInputError, SearchLimitError
from ..routing.graph_loader import load_graph
from ..routing.preferences import RoutingPreferences

router = APIRouter()
logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_graph() -> nx.DiGraph:
    return load_graph()


@router.post("/v1/routes", response_model=RouteResponse)
def routes(
    request: RouteRequest, graph: Annotated[nx.DiGraph, Depends(get_graph)]
) -> RouteResponse:
    origin, destination = request.origin.node_id, request.destination.node_id
    if origin not in graph or destination not in graph:
        raise HTTPException(404, "Origin or destination is outside the current pilot network.")
    if origin == destination:
        raise HTTPException(422, "Choose different origin and destination nodes.")
    try:
        # departure_time is trip metadata, not the data-quality clock. Keep the fixed demo
        # reference time; profiles already encode intent, and no live conditions exist.
        preferences = (
            RoutingPreferences(**request.preferences.model_dump(exclude={"prefer_covered_paths"}))
            if request.preferences
            else RoutingPreferences()
        )
        results = compute_routes(
            graph, origin, destination, request.profile, preferences=preferences
        )
        return RouteResponse(
            dataset_id=graph.graph["dataset_id"],
            reference_time=graph.graph["reference_time"],
            routes=tuple(
                RouteOption(
                    **result.model_dump(
                        exclude={"geometry", "node_path", "segment_ids", "dataset_id", "data_kind"}
                    ),
                    geometry=RouteGeometry(coordinates=result.geometry),
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

"""Brickfields pilot boundary and conservative node snapping (no invented connectors)."""

from math import asin, cos, radians, sin, sqrt

import networkx as nx

from .errors import RoutingInputError

CENTER = (101.6869, 3.1334)
RADIUS_M = 2000
MAX_SNAP_M = 75
WALK_SPEED_M_S = 1.25


def distance_m(a: tuple[float, float], b: tuple[float, float]) -> float:
    lon1, lat1, lon2, lat2 = map(radians, (*a, *b))
    h = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 6371009 * 2 * asin(sqrt(min(h, 1)))


def snap_coordinate(graph: nx.DiGraph, longitude: float, latitude: float) -> tuple[str, float]:
    point = (longitude, latitude)
    if distance_m(CENTER, point) > RADIUS_M:
        raise RoutingInputError("Location is outside the 2 km Brickfields pilot area.")
    candidates = (
        (distance_m(point, data["record"].coordinates), node)
        for node, data in graph.nodes(data=True)
        if graph.degree(node) > 0 and not data.get("snap_excluded", False)
    )
    separation, node = min(candidates, default=(float("inf"), ""))
    if separation > MAX_SNAP_M:
        raise RoutingInputError(
            "Location is outside the mapped pedestrian network (75 m snap limit)."
        )
    return node, separation

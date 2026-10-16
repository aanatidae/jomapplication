"""Meaningful offline failures; a later HTTP adapter can translate them."""


class GraphDataError(ValueError):
    """Pilot input cannot form a valid graph."""


class RoutingInputError(ValueError):
    """Unknown endpoints or invalid internal query."""


class NoRouteError(ValueError):
    """No traversable path satisfies this profile's constraints."""


class SearchLimitError(RuntimeError):
    """Candidate budget exhausted; never silently return an incomplete ranking."""

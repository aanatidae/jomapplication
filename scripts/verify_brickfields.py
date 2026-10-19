"""Verify three real, public-landmark trips against the cached graph and optional HTTP API."""

import argparse
import json
from pathlib import Path
from time import monotonic
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from services.api.app.routing.engine import compute_routes
from services.api.app.routing.errors import NoRouteError
from services.api.app.routing.osm_import import DATA_DIR, load_osm_graph
from services.api.app.routing.profiles import PROFILES
from services.api.app.routing.scoring import is_edge_allowed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", help="Optional running API base URL, e.g. http://127.0.0.1:8000")
    args = parser.parse_args()
    graph = load_osm_graph()
    catalog = json.loads((DATA_DIR / "destinations.json").read_text(encoding="utf-8"))
    records = []
    for start, end in ((0, 1), (1, 2), (2, 3)):
        a, b = catalog[start], catalog[end]
        began = monotonic()
        route = compute_routes(graph, a["node_id"], b["node_id"], "fastest", max_results=1)[0]
        item = {"origin": a["label"], "destination": b["label"],
                "distance_m": round(route.distance_m, 2),
                "duration_s": round(route.estimated_time_s, 2),
                "geometry_points": len(route.geometry), "segments": len(route.segment_ids),
                "calculation_s": round(monotonic() - began, 3),
                "accessibility_incomplete": route.data_quality.accessibility_incomplete,
                "last_verified_at": route.data_quality.last_verified_at}
        if args.api:
            body = {"origin": {k: a[k] for k in ("latitude", "longitude")},
                    "destination": {k: b[k] for k in ("latitude", "longitude")}, "profile": "fastest"}
            request = Request(args.api.rstrip("/") + "/v1/routes", json.dumps(body).encode(),
                              {"Content-Type": "application/json"})
            with urlopen(request, timeout=30) as response:
                value = json.load(response)
            assert value["data_kind"] == "OPENSTREETMAP"
            assert value["routes"][0]["geometry"]["coordinates"] == [list(p) for p in route.geometry]
            item["http_geometry_matches_graph"] = True
        records.append(item)
    first, second = catalog[:2]
    try:
        compute_routes(graph, first["node_id"], second["node_id"], "step_free", max_results=1)
    except NoRouteError:
        step_free = "Unavailable: critical accessibility attributes unknown; no stairs fallback"
    else:
        step_free = "Available on recorded attributes only"
    if args.api:
        body = {"origin": {"latitude": 0, "longitude": 0},
                "destination": {"latitude": second["latitude"], "longitude": second["longitude"]},
                "profile": "fastest"}
        try:
            urlopen(Request(args.api.rstrip("/") + "/v1/routes", json.dumps(body).encode(),
                            {"Content-Type": "application/json"}), timeout=30)
        except HTTPError as error:
            assert error.code == 404 and "outside" in json.load(error)["detail"]
        else:
            raise AssertionError("Outside-pilot request unexpectedly accepted")
    edges = [d["record"] for _, _, d in graph.edges(data=True)]
    result = {"trips": records, "step_free": step_free,
              "confirmed_stair_segments": sum(e.stairs is True for e in edges),
              "step_free_eligible_segments": sum(is_edge_allowed(e, PROFILES["step_free"]) for e in edges),
              "osm_lighting_tag_segments": sum("lit" in e.osm_tags for e in edges),
              "verified_lighting_score_segments": sum(e.lighting_score is not None for e in edges),
              "verified_security_segments": sum(e.security_facility_verified is True for e in edges)}
    output = Path("docs/brickfields/route-verification.json")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()

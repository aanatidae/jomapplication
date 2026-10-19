"""Reproducible, offline-loadable Overpass -> existing NetworkX routing records.

Run explicitly: python -m services.api.app.routing.osm_import --download
OSM is community mapping, never venue-verified safety/accessibility evidence.
"""

import argparse
import gzip
import json
from datetime import UTC, datetime
from itertools import pairwise
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

import networkx as nx

from .geography import CENTER, RADIUS_M, WALK_SPEED_M_S, distance_m, snap_coordinate
from .models import Edge, Node

DATA_DIR = Path(__file__).resolve().parents[2] / "data/brickfields"
EXTRACT_PATH = DATA_DIR / "osm.json.gz"
GRAPH_PATH = DATA_DIR / "walking.json.gz"
OVERPASS = "https://overpass-api.de/api/interpreter"
# Fetch full member nodes so no geometry is clipped or interpolated.
QUERY = """[out:json][timeout:180];
(
  way(around:2200,3.1334,101.6869)["highway"];
  nwr(around:2000,3.1334,101.6869)["name"]["railway"="station"];
  nwr(around:2000,3.1334,101.6869)["name"]["shop"="mall"];
  nwr(around:2000,3.1334,101.6869)["name"]["amenity"="place_of_worship"];
  nwr(around:2000,3.1334,101.6869)["name"]["tourism"];
); out meta center; >; out meta;"""
EXCLUDED_HIGHWAYS = {
    "motorway",
    "motorway_link",
    "trunk",
    "trunk_link",
    "construction",
    "proposed",
    "abandoned",
    "razed",
    "raceway",
    "bus_guideway",
    "platform",
}
DENIED = {"no", "private", "customers", "permit", "delivery", "destination", "use_sidepath"}

# Only entrances present on the pedestrian graph are named as entrances. Other
# landmarks explicitly route to a nearby mapped approach, never to an invented door.
LANDMARKS = (
    ("KL Sentral · south entrance", "way", 638688527, "osm_11925140813"),
    ("NU Sentral · main entrance", "way", 670478935, "osm_7045493653"),
    ("Vivekananda Ashram · mapped approach", "way", 466004234, None),
    ("Little India · mapped approach", "node", 4327707896, None),
    ("Buddhist Maha Vihara · mapped approach", "way", 467858444, None),
)


def landmark_catalog(extract: dict, graph: nx.DiGraph) -> list[dict]:
    elements = {(e["type"], e["id"]): e for e in extract["elements"]}
    result = []
    for label, kind, osm_id, preferred in LANDMARKS:
        feature = elements[(kind, osm_id)]
        point = feature.get("center", feature)
        node = preferred or snap_coordinate(graph, point["lon"], point["lat"])[0]
        if node not in graph:
            raise ValueError(f"Landmark entrance no longer mapped: {label}")
        lon, lat = graph.nodes[node]["record"].coordinates
        result.append(
            {
                "label": label,
                "latitude": lat,
                "longitude": lon,
                "node_id": node,
                "osm_feature": f"https://www.openstreetmap.org/{kind}/{osm_id}",
                "osm_name": feature["tags"]["name"],
            }
        )
    return result


def walkable(tags: dict) -> bool:
    highway = tags.get("highway")
    if not highway or highway in EXCLUDED_HIGHWAYS or tags.get("area") == "yes":
        return False
    if tags.get("foot") in DENIED:
        return False
    if tags.get("access") in DENIED and tags.get("foot") not in {"yes", "designated", "permissive"}:
        return False
    if highway == "cycleway" and tags.get("foot") not in {"yes", "designated", "permissive"}:
        return False
    return True


def number(tags: dict, key: str) -> float | None:
    try:
        return float(tags[key].removesuffix("%"))
    except (KeyError, ValueError, AttributeError):
        return None


def edge_record(way: dict, a: Node, b: Node, index: int, node_tags: tuple[dict, ...]) -> Edge:
    tags = way.get("tags", {})
    distance = distance_m(a.coordinates, b.coordinates)
    blocked = any(
        t.get("foot") in DENIED
        or t.get("access") in DENIED
        or t.get("barrier") in {"wall", "fence", "block"}
        for t in node_tags
    )
    # A barrier node applies to its incident segments. Unknown gates/lifts remain uncertain.
    obstacles = {t.get("barrier") for t in node_tags} & {"stile", "turnstile", "kissing_gate"}
    stairs = True if tags.get("highway") == "steps" or obstacles else None
    if stairs is None and tags.get("step_count") == "0":
        stairs = False
    return Edge(
        segment_id=f"osm_{way['id']}_{index}_{a.id}_{b.id}",
        start_node=a.id,
        end_node=b.id,
        geometry=(a.coordinates, b.coordinates),
        distance_m=max(distance, 0.01),
        estimated_time_s=max(distance, 0.01) / WALK_SPEED_M_S,
        stairs=stairs,
        elevator_required=True if tags.get("highway") == "elevator" or any(
            t.get("highway") == "elevator" for t in node_tags
        ) else None,
        ramp={"yes": True, "no": False}.get(tags.get("ramp")),
        curb_cut=True if any(t.get("kerb") in {"lowered", "flush"} for t in node_tags) else None,
        slope_percent=number(tags, "incline"),
        # Wheelchair=no is a hard exclusion; yes alone cannot establish every critical field.
        accessible_entrance=False
        if tags.get("wheelchair") == "no" or any(t.get("wheelchair") == "no" for t in node_tags)
        else None,
        is_closed=blocked,
        source="OpenStreetMap contributors (ODbL)",
        verification_level="unverified",
        last_updated_at=None,
        osm_way_id=way["id"],
        osm_tags=tags,
    )


def import_extract(extract: dict) -> nx.DiGraph:
    elements = {(e["type"], e["id"]): e for e in extract["elements"]}
    nodes = {i: e for (kind, i), e in elements.items() if kind == "node" and "lat" in e}
    graph = nx.DiGraph(
        dataset_id="brickfields_osm_v1",
        data_kind="OPENSTREETMAP",
        coordinate_system="WGS84",
        reference_time=datetime.fromisoformat(
            extract["osm3s"]["timestamp_osm_base"].replace("Z", "+00:00")
        ),
        center=CENTER,
        radius_m=RADIUS_M,
    )
    for (_, _), way in sorted(elements.items()):
        if way["type"] != "way" or not walkable(way.get("tags", {})):
            continue
        for index, (a_id, b_id) in enumerate(pairwise(way["nodes"])):
            if a_id == b_id or a_id not in nodes or b_id not in nodes:
                continue
            a, b = nodes[a_id], nodes[b_id]
            if any(distance_m(CENTER, (n["lon"], n["lat"])) > RADIUS_M for n in (a, b)):
                continue
            for n in (a, b):
                key = f"osm_{n['id']}"
                tags = n.get("tags", {})
                graph.add_node(
                    key,
                    record=Node(
                        id=key,
                        name=tags.get("name", key),
                        kind="crossing"
                        if tags.get("highway") == "crossing"
                        else "entrance"
                        if "entrance" in tags
                        else "intersection",
                        coordinates=(n["lon"], n["lat"]),
                    ),
                    osm_tags=tags,
                )
            start, end = f"osm_{a_id}", f"osm_{b_id}"
            # Preserve parallel ways with a private intermediate node, never collapse attributes.
            if graph.has_edge(start, end) or graph.has_edge(end, start):
                mid = f"way_{way['id']}_{index}"
                point = tuple((a[k] + b[k]) / 2 for k in ("lon", "lat"))
                graph.add_node(
                    mid,
                    record=Node(id=mid, name=mid, kind="intersection", coordinates=point),
                    snap_excluded=True,
                )
                pairs = ((start, mid), (mid, end))
            else:
                pairs = ((start, end),)
            directions = way.get("tags", {}).get("oneway:foot")
            for u, v in pairs:
                for x, y in ((u, v), (v, u)):
                    if (directions == "yes" and x == v) or (directions == "-1" and x == u):
                        continue
                    record = edge_record(
                        way,
                        graph.nodes[x]["record"],
                        graph.nodes[y]["record"],
                        index,
                        (a.get("tags", {}), b.get("tags", {})),
                    )
                    graph.add_edge(x, y, record=record)
    if graph.number_of_edges() < 100:
        raise ValueError("Extract has insufficient pedestrian topology; existing cache preserved")
    return graph


def save_graph(graph: nx.DiGraph, path: Path = GRAPH_PATH) -> None:
    payload = {
        "metadata": {**graph.graph, "reference_time": graph.graph["reference_time"].isoformat()},
        "nodes": [
            {
                "record": d["record"].model_dump(mode="json"),
                "osm_tags": d.get("osm_tags", {}),
                "snap_excluded": d.get("snap_excluded", False),
            }
            for _, d in sorted(graph.nodes(data=True))
        ],
        "edges": [
            d["record"].model_dump(mode="json") for _, _, d in sorted(graph.edges(data=True))
        ],
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_bytes(
        gzip.compress(json.dumps(payload, separators=(",", ":")).encode(), mtime=0)
    )
    temporary.replace(path)


def load_osm_graph(path: Path = GRAPH_PATH) -> nx.DiGraph:
    payload = json.loads(gzip.decompress(path.read_bytes()))
    meta = payload["metadata"]
    meta["reference_time"] = datetime.fromisoformat(meta["reference_time"])
    graph = nx.DiGraph(**meta)
    for item in payload["nodes"]:
        record = Node.model_validate_json(json.dumps(item.pop("record")))
        graph.add_node(record.id, record=record, **item)
    for item in payload["edges"]:
        record = Edge.model_validate_json(json.dumps(item))
        graph.add_edge(record.start_node, record.end_node, record=record)
    return nx.freeze(graph)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download", action="store_true")
    parser.add_argument("--endpoint", default=OVERPASS)
    args = parser.parse_args()
    if args.download:
        request = Request(
            args.endpoint,
            data=urlencode({"data": QUERY}).encode(),
            headers={"User-Agent": "Jom-Brickfields-Pilot/1.0 (OSM data import)"},
        )
        with urlopen(request, timeout=210) as response:
            raw = response.read()
        extract = json.loads(raw)
    else:
        raw = gzip.decompress(EXTRACT_PATH.read_bytes())
        extract = json.loads(raw)
    graph = import_extract(extract)
    catalog = landmark_catalog(extract, graph)
    save_graph(graph)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    EXTRACT_PATH.write_bytes(gzip.compress(raw, mtime=0))
    previous = (
        json.loads((DATA_DIR / "manifest.json").read_text())
        if (not args.download and (DATA_DIR / "manifest.json").exists())
        else {}
    )
    manifest = {
        "source": "OpenStreetMap contributors",
        "license": "ODbL-1.0",
        "attribution": "https://www.openstreetmap.org/copyright",
        "endpoint": args.endpoint,
        "query": QUERY,
        "downloaded_at": datetime.now(UTC).isoformat(),
        "osm_timestamp": extract["osm3s"]["timestamp_osm_base"],
        "center": CENTER,
        "radius_m": RADIUS_M,
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
    }
    if previous:
        manifest.update({key: previous[key] for key in ("endpoint", "downloaded_at")})
    (DATA_DIR / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (DATA_DIR / "destinations.json").write_text(
        json.dumps(catalog, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()

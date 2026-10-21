"""Replay API geometry through Android Emulator GPS, never through app state.

The resulting GPX can also be loaded into Android Studio Extended controls > Location.
Use --prepare first, set the emulator to the first point, tap Start, then --replay.
"""
import argparse
import json
import math
import subprocess
import time
from pathlib import Path
from urllib.request import Request, urlopen
from xml.sax.saxutils import escape

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--prepare", action="store_true")
parser.add_argument("--replay", action="store_true")
parser.add_argument("--speed", type=float, default=1.4, help="Simulated metres/second")
parser.add_argument("--api", default="http://127.0.0.1:8000")
parser.add_argument("--adb", default="C:/Users/SawJu/AppData/Local/Android/Sdk/platform-tools/adb.exe")
parser.add_argument("--serial", default="emulator-5554")
args = parser.parse_args()
folder = Path("docs/navigation")
folder.mkdir(parents=True, exist_ok=True)
if args.prepare:
    catalog = json.loads(Path("apps/mobile/src/features/planner/destinations.json").read_text(encoding="utf-8"))
    body = {"origin": {k: catalog[0][k] for k in ("latitude", "longitude")},
            "destination": {k: catalog[1][k] for k in ("latitude", "longitude")}, "profile": "fastest"}
    request = Request(args.api + "/v1/routes", json.dumps(body).encode(), {"Content-Type": "application/json"})
    with urlopen(request, timeout=30) as response:
        result = json.load(response)
    (folder / "walking-route.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
result = json.loads((folder / "walking-route.json").read_text(encoding="utf-8"))
coordinates = result["routes"][0]["geometry"]["coordinates"]
points = []
for a, b in zip(coordinates, coordinates[1:]):
    length = math.hypot((b[0] - a[0]) * 111195 * math.cos(math.radians(a[1])), (b[1] - a[1]) * 111195)
    for index in range(max(1, math.ceil(length / (args.speed * 3)))):
        t = index / max(1, math.ceil(length / (args.speed * 3)))
        points.append([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])
points.extend([coordinates[-1]] * 4)
gpx = '<?xml version="1.0"?><gpx version="1.1" creator="Jom emulator QA" xmlns="http://www.topografix.com/GPX/1/1"><trk><name>' + escape("Simulated KL Sentral to NU Sentral") + '</name><trkseg>'
gpx += ''.join(f'<trkpt lat="{lat}" lon="{lon}"><ele>25</ele></trkpt>' for lon, lat in points)
gpx += '</trkseg></trk></gpx>'
(folder / "brickfields-walk.gpx").write_text(gpx, encoding="utf-8")
if args.replay:
    if not 0 < args.speed <= 3:
        raise SystemExit("Use a walking speed above zero and no greater than 3 m/s")
    for index, (lon, lat) in enumerate(points):
        subprocess.run([args.adb, "-s", args.serial, "emu", "geo", "fix", str(lon), str(lat), "25", "8"], check=True, stdout=subprocess.DEVNULL)
        if index % 10 == 0:
            print(f"SIMULATED GPS {index}/{len(points)}: {lat:.6f}, {lon:.6f}", flush=True)
        time.sleep(3)
else:
    print(f"Prepared {len(points)} GPS updates. First lon/lat: {points[0]}. App must receive these via normal expo-location subscriptions.")

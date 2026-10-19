"""Vendor the pinned BSD-2-Clause Leaflet runtime; no remote map scripts."""

import base64
import hashlib
import io
import json
import tarfile
from pathlib import Path
from urllib.request import urlopen

version = "1.9.4"
with urlopen(f"https://registry.npmjs.org/leaflet/{version}", timeout=30) as response:
    metadata = json.load(response)
with urlopen(metadata["dist"]["tarball"], timeout=30) as response:
    raw = response.read()
integrity = "sha512-" + base64.b64encode(hashlib.sha512(raw).digest()).decode()
assert integrity == metadata["dist"]["integrity"]
with tarfile.open(fileobj=io.BytesIO(raw), mode="r:gz") as package:
    read = lambda name: package.extractfile("package/" + name).read().decode()
    assets = {"version": version, "integrity": integrity, "js": read("dist/leaflet.js"),
              "css": read("dist/leaflet.css"), "license": read("LICENSE")}
target = Path(__file__).resolve().parents[1] / "apps/mobile/src/features/planner/leafletAssets.json"
target.write_text(json.dumps(assets, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Vendored Leaflet {version}; {integrity}")

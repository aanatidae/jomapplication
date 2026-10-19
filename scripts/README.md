# Development scripts

`python -m scripts.verify_brickfields --api http://127.0.0.1:8000` verifies three
real geographic trips against the cached OSM graph and the running API, including
exact geometry, outside-pilot rejection and strict accessibility availability.
`python -m services.api.app.routing.osm_import --download` deliberately refreshes
the public OSM source and graph. See `docs/brickfields/README.md` before updating.
`python scripts/vendor_leaflet.py` refreshes the pinned, integrity-checked BSD-2-Clause
Leaflet bundle; it does not run remote scripts.

`expo.cjs` resolves Expo from the mobile workspace regardless of npm hoisting. Root npm scripts provide mobile commands; API commands remain explicit Python module commands in the root README.

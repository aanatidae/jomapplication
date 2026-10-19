# Brickfields geographic pilot

The application now defaults to a real OpenStreetMap walking network around
NU Sentral / KL Sentral (3.1334 N, 101.6869 E), clipped to a 2,000 m radius.
This is a community-mapped pilot, with incomplete pedestrian connectivity,
accessibility and environmental data. It is not a surveyed accessible network.

## Data and provenance

`services/api/data/brickfields/osm.json.gz` is the downloaded Overpass source.
`walking.json.gz` is the derived, cached NetworkX graph. `manifest.json` records
the query, source timestamp, download time, coverage and graph size.
`destinations.json` links each initial landmark to its source OSM feature and
its mapped entrance or explicitly labelled nearby approach. The mobile copy
is `apps/mobile/src/features/planner/destinations.json`.

The import requests a 2.2 km buffer and retains only segments with both
endpoints within the 2 km supported area. Consecutive OSM way nodes define
segments, so bends and shared-node connectivity are preserved. Grade-separated
paths do not connect merely because their coordinates intersect. Parallel ways
retain separate records through non-snappable midpoint subdivisions; there is
no straight-line shortcut between nearby unconnected ways.

Motorways/trunks, construction, prohibited/private foot access, restricted
service ways and explicitly non-pedestrian cycleways are excluded. Road motor
vehicle one-way rules do not prohibit walking in reverse; `oneway:foot` does.
Node restrictions and mapped barriers affect incident edges. Raw OSM way tags,
node tags and way IDs remain in the cache. Missing attributes stay null. OSM
edit/download timestamps are **not** condition-verification timestamps.

Roads legally permitting walking can lack separate sidewalks or mapped
crossings. A route following a mapped road does not establish a protected
walkway. Indoor paths are used only when explicitly mapped and connected;
opening hours, public admission, usable lifts and current conditions are not
guaranteed. No inferred indoor shortcuts are added. Basemap tiles update
independently from the cached routing extract and may disagree with it.

## Refresh

Run from repository root, with the existing Python environment:

```powershell
.\.venv\Scripts\python.exe -m services.api.app.routing.osm_import --download --endpoint https://overpass-api.de/api/interpreter
Copy-Item services/api/data/brickfields/destinations.json apps/mobile/src/features/planner/destinations.json
.\.venv\Scripts\python.exe -m pytest services/api/tests
.\.venv\Scripts\python.exe -m scripts.verify_brickfields
```

Without `--download`, the importer rebuilds from the source already on disk.
The graph is validated and replaced atomically; request handlers never call
Overpass. Restart FastAPI after an update to clear its process-local graph
cache. Review changed landmark entrances and all verification results before
shipping an updated extract. Public Overpass services are best-effort; an
outage does not remove the existing graph. Keep updates deliberate, not per
request or per app launch.

## Routing and profiles

`POST /v1/routes` accepts either `{latitude, longitude}` or a real `{node_id}`
for each endpoint. Geometry uses GeoJSON **[longitude, latitude]**, WGS84.
Coordinates must lie inside the pilot and within 75 m of a graph node.
Snapping does not validate a connection across a wall, street, floor or private
entrance. The response exposes snap distances and network coordinates; the map
marks chosen points and mapped route endpoints separately. The unmapped gap
is not drawn as a route or counted in distance/time. Prefer the curated mapped
entrances/approaches and check access on site. Equal snapped nodes return 422;
outside coverage, excessive snapping or no connected path returns 404.

Fastest optimizes estimated time at configurable 1.25 m/s. It does not include
crossing waits, congestion or measured individual walking speed. Safer at Night
retains the existing configurable environmental weights, but no OSM tag is
promoted to independently verified lighting, activity or staffed security.
When verified attributes are unavailable it can return the same path as
Fastest, with explicit uncertainty. No safety scores are fabricated.

Strict Step-Free retains the original hard constraints: confirmed stairs and
inaccessible segments are excluded, as are missing critical slope, width,
surface, lift and crossing/entrance information. The present extract cannot
establish a complete step-free route for the tested trips. The response is
unavailable, with no fallback through stairs. `wheelchair=yes` on a building
does not establish accessibility of its approach. Saved Avoid stairs / Avoid
steep slopes preferences can likewise make Fastest unavailable; the app
explains that preferences may constrain results and keeps Profile editable.

The original schematic dataset remains an explicit regression/demo fixture.
For old demos only, set `JOM_ROUTING_DATASET=simulated_demo` on FastAPI and use
the existing development fixture screens. The geographic app never silently
falls back to simulated routing.

## Map provider and location

Default: locally bundled BSD-2-Clause Leaflet 1.9.4 in SDK-compatible
`react-native-webview`, using OSM Standard raster tiles. No provider key or
account is required for this limited interactive pilot. The native
`react-native-maps` option remains available with
`EXPO_PUBLIC_MAP_RENDERER=native`. Android custom builds need a restricted
`GOOGLE_MAPS_ANDROID_API_KEY` in the build environment and Maps SDK enabled;
restrict the key to the Android package and signing SHA-1. Rebuild after
changing native keys. iOS native mode uses Apple Maps. Expo Go's bundled
Google Maps key failed authorization on the tested emulator; a blank native
map is not a verified rendering result.

`EXPO_PUBLIC_MAP_TILE_URL` can select a different HTTPS `{z}/{x}/{y}` tile
provider, with `EXPO_PUBLIC_MAP_TILE_ATTRIBUTION` for its additional text.
Check that provider's usage terms and public-key restrictions. Do not place
private credentials in any `EXPO_PUBLIC_*` variable. Restart Metro for config
changes. Map failure has a separate retry and retains manual place selection.

Foreground GPS permission is requested only after Use current location. No
background permission or automatic route history is added. Denial/unavailable
GPS keeps manual landmark and map selection. User location is used in memory
and sent to the configured routing API for the requested trip; basemap requests
reveal the viewed area to the map provider. Map WebView geolocation is disabled.

## Supabase and old content

Apply `supabase/migrations/202610190001_geographic_snapshots.sql` to the existing
project. It expands the existing bounded JSON validators to WGS84 and preserves
schematic rows, RLS, ownership, verification protection, photos and expiry.
New route sharing and barrier reports retain real coordinates. Existing demo
content remains visibly schematic. New contributions remain Community
submitted and never change traversal automatically. Hosted geographic writes
require this migration; a public client key cannot apply schema changes.
The validator migration can be rerun safely. If applied through the dashboard,
reconcile its version with your CLI migration history before later deployments
(after verification, `supabase migration repair --status applied 202610190001`
on the correctly linked project), or let the CLI apply the same idempotent SQL.

Check the applied validators with
`node --env-file=apps/mobile/.env.local scripts/verify-brickfields-supabase.mjs`.
After that passes, add `--write-test` with the geographic API running to check
real route/report persistence, two-user ownership, verification guards and
temporary expiry. This creates only private disposable rows, then deletes
those exact rows; it does not publish content or alter existing user records.

## Licensing and usage

Routing extract and derived database: © OpenStreetMap contributors, available
under the [Open Database License](https://www.openstreetmap.org/copyright).
Retain attribution and the ODbL notice when redistributing the extract or
derived database; make the source/derived database available under ODbL.
This repository includes both the imported source and derived cache. Jom!'s
application code does not become ODbL merely by using the database.

Map attribution is visible inside the map and beneath it. Leaflet's BSD-2-Clause
license and pinned package integrity are included in `leafletAssets.json`;
refresh it with `python scripts/vendor_leaflet.py` only after review.

OSM Standard [tile usage policy](https://operations.osmfoundation.org/policies/tiles/):
HTTPS official tile URL, identifiable Jom User-Agent/contact repository,
WebView HTTP cache honoring server headers, no cache bypass, no bulk download,
prefetch, map scraping or offline tile packages. Only visible viewports load.
For wider deployment use an appropriately provisioned provider or self-hosted
tiles; OSM's community servers have no SLA. The routing graph is cached OSM
data, distinct from map tiles and their separate policy.

Actual automated and native results are recorded in `results.md` and
`route-verification.json`; untested platform/credential-dependent work must
not be represented as a pass.

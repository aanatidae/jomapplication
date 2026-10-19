# Brickfields integration verification — 19 October 2026

## Implemented and verified locally

- Real cached OSM snapshot: 19,009 nodes / 42,508 directed segments, within 2 km
  of 3.1334 N, 101.6869 E. Downloaded from the main public Overpass service;
  source timestamp 2026-10-19 04:10:48 UTC. Source query/metadata, original
  extract and derived cache are checked in. No per-request OSM download.
- Default Leaflet/OSM map renders roads, buildings, footpaths and POIs in Expo Go
  on Android. A/B markers, route polylines, zoom, pan and map-selected destination
  verified with native screenshots/UI trees. Native Google renderer reproduced
  authorization failure; retained as an opt-in for properly configured builds.
- Live HTTP coordinate routing matches the original mapped way geometry exactly
  on all three tested trips. Offline assertions also check each geometry point
  lies on its source OSM way segment, distance sums, ETA and Dijkstra optimality.
- Step-Free rejects all 992 directed confirmed stair segments. Zero segments
  have all required critical accessibility attributes, so the real tested trip
  correctly returns unavailable. No stairs/unknown-accessibility fallback.
- 438 directed segments have an OSM `lit` tag; none is independently verified
  lighting data. No lighting score, activity or staffed security is invented.
  Safer at Night returns the same 316.41 m / 253.13 s first route for the default
  trip, honestly reporting Contains stairs and incomplete environmental data.
- Outside-pilot, distant snapping, malformed/ambiguous coordinate requests,
  disconnected paths, same snapped node, API failure and Retry are covered.
  Chosen coordinates and network endpoints remain distinct; no gap connector is
  drawn or counted in the route distance.

| Real geographic trip | Network distance | Estimated time | Geometry vertices |
| --- | ---: | ---: | ---: |
| KL Sentral south entrance → NU Sentral main entrance | 316.41 m | 253.13 s | 20 |
| NU Sentral main entrance → Vivekananda Ashram mapped approach | 426.87 m | 341.50 s | 23 |
| Vivekananda Ashram approach → Little India mapped approach | 308.04 m | 246.43 s | 23 |

Detailed repeatable results: `route-verification.json` and
`python -m scripts.verify_brickfields --api http://127.0.0.1:8000`.
After the geographic baseline/cost fast path, individual offline calculations
were 0.19–0.28 s in the final recorded run; no release performance claim.

## Required quality gates

- `npm run check`: lint and strict TypeScript pass; 104 tests, 16 suites pass.
  Includes old onboarding/preferences/community/photos/auth/reporting tests and
  new geographic geometry, map bridge, permission denial, granted-coordinate
  request, GPS timeout, map failure/retry and geographic report validation.
- `python -m ruff check services/api`: pass.
- `python -m pytest services/api/tests -q`: 138 pass. Preserved non-fatal
  Starlette/httpx deprecation warning. Explicit fixture setup isolates old
  simulated HTTP tests from the geographic default.
- Clean `npm ci --no-audit --prefer-offline`: pass, 1,078 packages. Every baseline
  dependency entry is unchanged. Only two added entries: SDK-compatible
  expo-location 57.0.21 and react-native-webview 13.16.1.
- Android production Hermes export: pass (1,759 modules / approximately 4.8 MB).
- `git diff --check`: pass. No privileged key, database credentials, deployment,
  push, schema deletion or user-content deletion introduced.

## Native observations

- Default KL Sentral/NU Sentral real map and route visually inspected. The route
  follows mapped paths around the mall instead of inventing an indoor shortcut.
  Evidence: `route-ready.png`, `leaflet-ready.png`, corresponding XML.
- Zoom and pan change the visible geographic map. Selecting a point on the map
  set destination to 3.133665, 101.687132 and returned a real 2-minute route.
  Evidence: `map-zoomed`, `map-panned`, `map-destination-selected`.
- Actual Android foreground prompt appears only after Use current location.
  Don’t allow produces the explicit denied message; a subsequent manual origin
  selection to Little India works and computes a route. Evidence:
  `location-prompt-current`, `location-denied`, `denied-manual-picker`,
  `denied-manual-selected`.
- One-time permission was also granted with injected KL Sentral emulator GPS.
  The emulator requested Google's additional Location Accuracy service; declining
  it correctly preserved the trip and showed Current location unavailable.
  No persistent accuracy service was enabled. The final location service
  suppresses this extra dialog and has a 15-second timeout. Actual physical
  GPS acquisition is not claimed; granted coordinates are verified in unit tests.
- 320dp / 200% text stress found WebView text auto-enlargement overlapping route
  endpoints/attribution. Fixed with map-only `textZoom=100`; native instructions,
  buttons and warnings still honor OS scaling. Large names/controls wrap and
  the page remains scrollable. Screenshots include the discovered condition and
  the corrected map. Original 1080×2400 / 420dpi / font scale 1.0 restored.
- Existing Prefer well-lit paths and Avoid stairs preferences were recorded.
  Avoid stairs was temporarily disabled for route QA and restored with an explicit
  Preferences saved confirmation and both original selections verified after a
  cold restart (`restored-profile-verified`). It makes routes unavailable when stair-free
  evidence is missing, even in Fastest. No silent preference reset is shipped.
- The existing share form receives the calculated geographic route, and the
  barrier location step shows the real route and waypoint choices. Both drafts
  were cancelled; no new public content was created by native QA.

## Hosted Supabase status

`202610190001_geographic_snapshots.sql` is prepared. A read-only public-key RPC
probe confirms the hosted old validators currently reject WGS84 snapshots.
The user has chosen to apply the migration in their SQL editor. Re-run
`node --env-file=apps/mobile/.env.local scripts/verify-brickfields-supabase.mjs`
after application. Until that check passes, hosted geographic share/report
writes are pending and must not be claimed verified. Existing schema/RLS,
ownership, verification, photos and expiry are retained; old schematic content
is preserved. No administrator credentials were requested in chat.

Docker CLI exists but its daemon is unavailable, so local Postgres migration
execution is not claimed. Physical Android, iOS, spoken TalkBack/VoiceOver,
real-world walking/surveying, lighting/security verification and complete
pedestrian accessibility remain untested or unavailable.

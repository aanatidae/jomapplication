# Report Barrier → simulated crossing closure → reroute → reset

This is an allowlisted, session-only hackathon simulation. Community reports retain
their existing repository and verification workflow. Demo reports never call a
report repository or write to Supabase, and a fresh Planner session starts clear.

## Filming

1. Run the API from the repository root:
   `.\.venv\Scripts\python.exe -m uvicorn services.api.app.main:app --reload --reload-dir services/api/app --host 127.0.0.1 --port 8000`
   Restricting reload to API source avoids scanning linked node_modules directories.
2. Run `npm run android`. If needed, use Android SDK platform-tools `adb reverse
   tcp:8000 tcp:8000` and `adb reverse tcp:8081 tcp:8081`.
3. In Planner choose **NU Sentral · main entrance** as origin and **Methodist College
   Kuala Lumpur (MCKL) · mapped approach** as destination. Select **Fastest**.
4. Show the original route, approximately **468.8 m / 375.0 seconds**.
5. Tap **Report Barrier**, then **Report a demo crossing blockage**. Select the
   category and the supported crossing; description is optional. Confirm the report.
   It remains **unverified**, with no closure or red X yet.
6. Tap **Activate simulated closure**. Show the red X, the calculated pedestrian
   detour, and the notice identifying the simulation. Expected catalogue-origin
   result: **515.3 m / 412.3 seconds**, approximately **46.5 m / 37.2 seconds** extra.
   The normal rounded minute labels are both 7 min; the demo notice also shows
   calculated seconds. Values are calculated, never hardcoded in application output.
7. Tap the X for its demo explanation. Tap **Clear demo blockage** to remove the X
   and notice and request the normal route again. Repeat without restarting.

The same modal is available during navigation. Opening or closing it does not
change pathname or dispose the location watcher. Activation/reset reroutes from a
fresh GPS reading, keeps destination/profile/preferences, and resets geometry-based
progress. If a current valid GPS origin is unavailable, the app explains its fallback
to Planner preview. Use an emulator GPS reading near the NU origin for navigation
filming; a stationary emulator does not simulate movement. Do not represent simulated
GPS or closure state as real-world verification.

## Routing boundary

`GET /v1/demo-crossing` validates existing OSM way 1264710459 and both directions of
`osm_11749673973 → osm_4619870919 → osm_6148809817`. The marker coordinate comes from
the middle graph node (3.1336672, 101.6884742), not a frontend coordinate constant.

`POST /v1/routes` accepts only the optional allowlisted
`demo_closure: "brickfields_crossing_1264710459"`. There is no arbitrary edge-closure
API. A request-local NetworkX view removes this way in both directions. The shared
cached graph and its records remain unchanged.

When the normal route uses the closed crossing, detours use mapped footways,
pedestrian ways, paths, steps or corridors between crossings. Existing permitted
endpoint approaches before the first/after the last crossing of the ordinary route
remain eligible, retaining NU's service-road access. This is a conservative demo
eligibility rule, not a global road ban or a production hazard-validation system.
It can reject a legitimate road-based detour that lacks sufficient pedestrian
mapping. Access restrictions, directed edges, profile/preference filters and
explicit separate-sidewalk handling still apply. Unaffected trips retain normal
routing eligibility. No connectors, waypoints or route geometries are added.

The NU → MCKL detour fully traverses eight mapped crossing ways:
1469443993, 1469443991, 467351432, 1482870717, 1317386682, 1302565938,
466005008 and 1317386683. Several are unmarked. Nothing is field verified; signal
waiting is excluded, and signal-control conflicts are not resolved by this demo.
Safer at Night and Step-Free remain unavailable where evidence is insufficient.

Closure changes invalidate pending navigation requests and clear Planner caches.
A failed closure calculation hides the obsolete route rather than guiding across
the blocked crossing. Stop, background pause, retry and recenter remain available.

Geographic Fastest requests return one calculated shortest option through the
engine's existing single-route path. Live checks exposed timeouts when enumerating
multiple alternatives; distances, geometry and profile restrictions are retained.
The simulated comparison fixture keeps its multi-option behavior.

## Verification completed

- Full backend suite: 156 passed. Final closure/MCKL/HTTP regressions after the
  Fastest response-time correction: 33 passed. Ruff passed. The existing Starlette
  TestClient/httpx deprecation warning remains; no dependency change was made.
- Full frontend suite: 143 tests across 20 suites passed. The subsequently added
  Leaflet marker bridge check also passed (144 distinct frontend tests verified).
  Final demo-flow and marker tests passed again after the compact metric change.
  TypeScript and Expo lint passed.
- Actual running HTTP API: normal 468.77 m / 375.02 s, closure 515.31 m / 412.25 s,
  reset 468.77 m / 375.02 s. Warm request timings were approximately 1.38 s,
  6.36 s and 1.39 s, respectively, on this machine.
- Final Android verification: Precise foreground permission was already granted.
  The existing latest-code API server was retained; no duplicate server was started.
  GPS was supplied externally through the emulator at latitude 3.1331550708543014,
  longitude 101.68764791886117. No application GPS values were fabricated.
- The catalogue-origin preview remained 468.77 m / 375.02 s. From the supplied GPS
  point, the real API calculates 453.89 m / 363.11 s normally and 500.43 m / 400.34 s
  with the closure. That point snaps 7.82 m to the network; this gap is not included
  in the route. The active UI showed approximately 496 m / 6 min 37 s remaining on
  the detour and 450 m / 6 min remaining after clearing, reflecting its geometric
  progress projection rather than a hardcoded catalogue-origin distance.
- Opening/closing Report Barrier preserved navigation. Explicit demo activation
  recalculated the active geometry, distance, ETA and progress while keeping Stop
  Navigation available. Clearing removed the marker/notice and restored normal
  routing without ending navigation. Two consecutive activation/reset cycles passed
  without an app restart; manual pan and Recenter also passed.
- Verification exposed and fixed two bugs: a stationary, distance-filtered GPS
  watcher could leave a stale session fix (closure changes now request a fresh SDK
  fix before falling back); and an unused Planner preview competed with the active
  navigation request (preview requests now pause during navigation). Cold starts
  were used to load these fixes, then repetition was verified without restarting.
  Final focused navigation/reporting tests: 36 passed; TypeScript and lint passed.
- All 17 segments of eight mapped crossing ways were verified from the actual
  GPS-origin detour edges. Both halves/directions of way 1264710459 were excluded;
  this GPS-origin detour used no carriageway edges. The shared graph stayed intact.
- Screenshots are local-only under `.local/phase4-e2e/`. Continuous walking and
  arrival were not replayed in this stationary check. The stale-signal notice may
  return while the emulator is stationary; activation/reset obtains a fresh real
  SDK fix, and Planner preview remains the fallback if that fix is unsuitable.

## Changed files

- `services/api/app/routing/demo_closure.py`
- `services/api/app/models/routes.py`
- `services/api/app/api/routes.py`
- `services/api/tests/test_demo_closure.py`
- `apps/mobile/src/services/routingApi.ts`
- `apps/mobile/src/features/barriers/BarrierModal.tsx`
- `apps/mobile/src/features/barriers/ReportScreen.tsx`
- `apps/mobile/src/features/barriers/ReportsScreen.tsx`
- `apps/mobile/src/features/planner/usePlanner.ts`
- `apps/mobile/src/features/planner/PlannerScreen.tsx`
- `apps/mobile/src/features/planner/GeographicMap.tsx`
- `apps/mobile/src/features/planner/LeafletMap.tsx`
- `apps/mobile/src/features/planner/leafletDocument.ts`
- `apps/mobile/src/features/navigation/session.ts`
- `apps/mobile/src/features/navigation/NavigationPanels.tsx`
- `apps/mobile/__tests__/demoBarrier.test.tsx`
- `apps/mobile/__tests__/navigationSession.test.ts`
- `apps/mobile/__tests__/leafletCamera.test.ts`
- This verification/filming guide.

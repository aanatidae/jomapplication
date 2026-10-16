# Phase 4/5 verification — 16 October 2026

Phase 4 and Phase 5 are complete for the simulated pilot. No later-phase features,
dependency changes, commits or pushes were included. Git was clean at intake.

## Architecture and contract

- Loader: `services/api/app/routing/graph_loader.py::load_graph`.
- Configuration: `routing/profiles.py`; engine: `routing/engine.py::compute_routes`.
- Explanations/verification: `routing/explanations.py`; confidence: `routing/confidence.py`.
- Reused domain types: `routing/models.py::RouteProfile`, `RouteConfidence`, `RouteResult`.
- HTTP models: `app/models/routes.py`; thin adapter: `app/api/routes.py`.
- `POST /v1/routes` accepts origin/destination `{node_id}`, one of the three existing
  profiles, optional aware departure timestamp and null/empty preferences. Reserved
  preference fields only accept null until engine support exists. Departure time
  is metadata; the synthetic graph's fixed reference time drives data freshness.
- Response is `{dataset_id,data_kind,reference_time,routes}` with 1–3 deterministic
  options: id/profile/geometry/distance_m/estimated_time_s/total_cost/reasons/warnings/
  confidence/verification_summary. Existing string reasons/warnings/verification
  and typed confidence are preserved. No raw weighting breakdown is exposed.
- Geometry is a LineString with `coordinate_system: local_metres_not_geographic`.
  No snapping or geographic claims. The Phase 2 native schematic projects these
  coordinates; thicker selected line is drawn last and options are numbered.
- HTTP 422: validation/same endpoints; 404: unknown node or no valid route with
  distinct details; Step-Free unavailable is explicit; 503: candidate budget;
  500: logged unexpected failure with sanitized client copy. No stairs fallback.
- Native Expo needs no CORS; browser cross-origin access remains disabled.
- Mobile transport is `src/services/routingApi.ts`; hook is `usePlanner.ts`.
  The hook caches by trip/profile, cancels obsolete work, suppresses stale results,
  manages selected alternatives separately and retries without the cached entry.
  The client validates response data and uses a 10-second abort timeout. No client
  environmental weights, accessibility exclusions or routing costs are calculated.
- URL is `EXPO_PUBLIC_API_BASE_URL`, supplied through app-local env or process env.
  USB/emulator uses ADB reverse; emulator alias/Wi-Fi phone setup is in README.
  The test session used isolated localhost Metro 8082 to preserve existing 8081.
- Live planner never silently falls back to mock data. Explicit development query
  previews preserve Phase 2 fixtures; release ignores them. No live location API
  is used, so denied permission cannot block manual pilot selection.

## Automated gates

Baseline before implementation: Ruff clean and 92 API tests pass, confirming the
completed Phase 3 engine. Phase 4 passed Ruff and 106 tests before mobile edits;
the final backend adds one retryable-search contract test.

Final commands actually executed from root:

```powershell
./.venv/Scripts/python.exe -m ruff check services/api
./.venv/Scripts/python.exe -m pytest services/api/tests
npm run check
```

Results: Ruff clean; **107 backend tests pass**, including **15 new HTTP contract
tests**; mobile lint and strict typecheck pass; **35 mobile tests pass** across
four suites. Mobile unit tests mock fetch and do not require FastAPI. Backend
fixtures generate the committed mobile contract examples. API tests preserve all
92 prior cases. The existing Starlette/httpx deprecation warning is non-fatal.
TestClient/Jest use the documented host workaround for Windows sandbox restrictions.

Live `GET /health`: 200 `{"status":"ok"}`. Exact three-profile HTTP outputs are in
`http-validation.json`; domain models and scoring were not changed.

## Native end-to-end scenarios

Target: Android Studio `Medium_Phone_API_37.0`, Expo Go SDK 57, emulator-5554.
The real Uvicorn service ran on loopback port 8000; ADB reverse connected the app.

| Same trip: Transit Stop → Residential Block | Preferred ETA | Distance | Result |
| --- | --- | --- | --- |
| Fastest | 8 min | 600 m | Straight stairs route, truthful stairs explanation |
| Safer at Night | 10 min | 720 m | Different upper path, lighting/public activity reasons, +2 min |
| Step-Free | 12 min | 830 m | Different lower path, no stairs, ramp/curb-cut reasons, +4 min |

All three returned HTTP 200 and the mobile map/cards rendered API geometry and
metrics. Profile changes sent correct profile names; no source/data edits occurred
between scenarios. Step-Free returned one valid option and displayed it gracefully.
Night displayed the exact warning **Accessibility information incomplete on 2
segment(s)** and Medium data confidence. No safety guarantee was introduced.

Also manually verified:

- Selecting Fastest Option 2 changes selected card and map to the 10-minute path.
- Manual origin/destination pickers use actual graph nodes. Community Mall request
  returns a distinct 9-minute/610-metre route; this is not a placeholder trip.
- Residential Block → Transit Stop, and Residential Block → Park Entrance, return
  no route; Step-Free remains selected with explicit unavailability and Retry.
- Removing only the emulator's API reverse mapping produces the real network-error
  state; restoring it and pressing Retry loads the same trip successfully.
- A temporary loopback HTTP fixture delayed its response for 15 seconds. The app
  showed Loading routes with old geometry/markers hidden, then the explicit timeout
  message after 10 seconds. Restoring the actual API mapping and Retry loaded the
  Park Entrance trip. Delayed fixture was stopped afterward; no app source edit
  or API URL change was needed for fault injection.

## UI stress/React review

Inspected native map, cards, comparison expansion/selection, profiles, picker,
loading, network error, timeout, no-route, unknown accessibility, confidence and
long verification text. Repeated at **320dp × 640dp / 200% font scaling**. Controls
wrap; reasons/warnings/freshness remain complete and reachable through scrolling.
Single-option counts use singular copy. Light-only/RTL unsupported remains unchanged.
Original 1080×2400 / density 420 / font scale 1.0 restored after QA.

| Finding | Fix and confirmation |
| --- | --- |
| Expected console.warn events create Expo LogBox over Retry | Use console.info; final error/no-route captures have no warning overlay |
| Progress indicator lacked explicit native accessibility participation | Marked accessible; feature loading test passes |
| One result announced as “1 route options” | Corrected singular; Step-Free capture confirms |
| Shared card contained mock 8-minute baseline calculation | Moved fixture detour text to mock data; live detours come from engine reasons |
| Unavailable results retained illustrative endpoint markers | Hide live markers as well as lines until results arrive |
| Alternative identity depended on grey paths | Added option numbers matching cards, retaining selected thickness and textual legend |

Stress field coverage: local place names are bounded by the pilot list; option count
is 1–3 (empty failures separately); metric fields are finite positive backend numbers;
reasons/warnings/verification strings have no schema length limit. Actual long
backend text was rendered without truncation. Existing development Worst case
previews and their tests still exercise long names/reasons/confidence, overlap and
permission recovery. A scrollable column keeps large content reachable; no fixed
card height was introduced. At 200% navigation retains the prior stacked layout.

React review: no new library, scoring, authored animation, duplicated transport,
unstable effect dependencies or expensive graph processing in UI. Cleanup aborts
pending work and guards stale completions. At most three route cards are rendered.
Profile intent and selected option ID are separate; no-route never changes intent.

Representative PNG/XML evidence: `fastest`, `night`, `step-free`, `night-card`,
`step-free-details`, `alternative-selected`, `network-error`, `no-route-final`,
`loading`, `timeout`, `timeout-recovered`, `small-large-profiles`,
`small-large-reasons`, `small-large-warnings`. Screenshots are native captures,
not generated mockups. XML can include off-screen nodes; screenshots and scrolling
were used to assess visible layout.

## Limitations

This is simulated local geometry, not geographic guidance. Phase 0 native map-provider
tiles remain unresolved and were not changed. Physical phone, iOS and spoken TalkBack
were not available/claimed. Data confidence uses the fixed synthetic reference time,
not live data. Preference customization and departure-time conditions are deferred
explicitly. No onboarding, auth, Supabase, community persistence, live location,
geocoding or later animation work was added. No blocking Phase 4/5 defect remains
within this pilot scope.

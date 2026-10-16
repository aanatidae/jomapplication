# Jom!

Pedestrian-first walking route planning. Project guidance lives in `.harness/AGENTS.md`, `.harness/PLAN.md`, and `.harness/TODOLIST.md`.

## Current scope

The planner calls FastAPI's Phase 3 engine for three profiles and displays simulated
pilot routes on the Phase 2 schematic map. Three-step onboarding and editable Profile
preferences persist locally. Community routes and barrier reports can be created and
viewed through local repositories. Supabase, live geography and animation polish
remain later phases. See [Phases 6–8 verification](docs/demo/phase678/results.md).
The native provider spike remains at `/spikes/map`, with its earlier blank-map issue separately tracked.

## Requirements

- Node 24.x and npm 11.x (tested: Node 24.19.0 and npm 11.17.0).
- Python 3.11.
- Android Studio with Android SDK/platform-tools and an emulator, or an Android phone with USB debugging enabled.
- Expo Go compatible with Expo SDK 57. Both Android Studio emulator and physical Android are supported development targets.

## Install from the project root

```powershell
npm ci
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r services/api/requirements-lock.txt
```

The root npm workspace owns the single `package-lock.json`. Run installation from the root; do not create an app-local lockfile. On macOS/Linux, replace `./.venv/Scripts/python.exe` with `./.venv/bin/python`.

Copy `.env.example` to `apps/mobile/.env.local` before starting Expo. The client reads
`EXPO_PUBLIC_API_BASE_URL`; restart Expo after changing it. Never put secrets in public values.

### Run API and mobile together

Terminal 1 (root):

```powershell
./.venv/Scripts/python.exe -m uvicorn services.api.app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2 (root):

```powershell
npm start
```

Use `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` with iOS Simulator or Android
ADB reverse: `adb -s <serial> reverse tcp:8000 tcp:8000` (in addition to Metro's 8081).
Android Studio emulator without reverse can use `http://10.0.2.2:8000`.
A USB-connected physical Android phone can also use ADB reverse and localhost.
For a phone over Wi-Fi, localhost refers to the phone: set the URL to your computer's
LAN address, start Uvicorn with `--host 0.0.0.0`, and allow port 8000 only on your
trusted development network. No developer LAN IP is committed. Metro LAN setup is
separate from the API URL. This is development setup, not deployment configuration.

Default demo trip: Transit Stop → Residential Block. Fastest is 8 min/600 m,
Safer at Night 10 min/720 m, Step-Free 12 min/830 m. Profiles work without code edits.
Places use actual pilot node IDs; Community Mall maps to `mall_entrance`.
The service timeout is 10 seconds. Errors/no-route states preserve the trip and offer
Retry; profile controls and manual place selection remain usable during requests.
No live location permission is requested. Returned reasons/warnings are the source
of truth, including unknown accessibility. Confidence and verification are simulated
data quality, never a safety guarantee. Development-only Phase 2 fixture previews
remain available via explicit `?demoState=...` URLs; the default planner has no offline mock fallback.

## Start the API

### Routing HTTP contract (Phase 4)

`POST /v1/routes` calls the existing Phase 3 engine. Example (curl in a POSIX shell):

```sh
curl -X POST http://127.0.0.1:8000/v1/routes \
  -H 'Content-Type: application/json' \
  -d '{"origin":{"node_id":"transit_stop"},"destination":{"node_id":"residential_block"},"profile":"safer_at_night"}'
```

Example response (actual preferred option shown; other alternatives omitted):

```json
{
  "dataset_id": "jom_simulated_pilot_v1",
  "data_kind": "SIMULATED_DEMO",
  "reference_time": "2026-10-16T12:00:00Z",
  "routes": [
    {
      "id": "safer_at_night-359b3ec3f8111840",
      "profile": "safer_at_night",
      "geometry": {
        "type": "LineString",
        "coordinate_system": "local_metres_not_geographic",
        "coordinates": [
          [
            0.0,
            0.0
          ],
          [
            0.0,
            180.0
          ],
          [
            200.0,
            120.0
          ],
          [
            400.0,
            0.0
          ]
        ]
      },
      "distance_m": 720.0,
      "estimated_time_s": 600.0,
      "total_cost": 1.308333332,
      "reasons": [
        "+2 min vs fastest",
        "Better lighting than fastest",
        "Passes active public areas",
        "Near a verified staffed security/public point",
        "No stairs recorded",
        "Avoids staircase on fastest route"
      ],
      "warnings": [
        "SIMULATED / DEMO graph; not for navigation or real-world safety claims.",
        "Environmental indicators are not guarantees; conditions may change.",
        "Accessibility information incomplete on 2 segment(s)"
      ],
      "confidence": {
        "level": "Medium",
        "factors": [
          "Accessibility information incomplete on 2 segment(s)"
        ],
        "as_of": "2026-10-16T12:00:00Z"
      },
      "verification_summary": "SIMULATED / DEMO only; venue_verified: 3; sources: synthetic_fixture_author; oldest known update: 2026-10-13T12:00:00+00:00; missing timestamps: 0"
    }
  ]
}
```

Supported profiles: `fastest`, `safer_at_night`, `step_free`. Inputs are node IDs only;
no coordinate snapping/geocoding is supported for this synthetic local-metre graph.
Optional timezone-aware `departure_time` is accepted as metadata; it does not change
the fixed demo data-quality clock or simulate live conditions. `preferences` may be
omitted, null, or empty, or contain supported explicit needs:

```json
{"prefer_well_lit": true, "avoid_stairs": true, "avoid_steep_slopes": false,
 "prefer_public_areas": false, "max_detour_minutes": 5}
```

Boolean fields are strict booleans; detour is an optional integer from 0–60 minutes
relative to the fastest usable route. Constraints are never relaxed to meet a detour
limit. Covered/shaded and ramps/elevators preferences are stored locally and clearly
labelled inactive; they are not sent. `prefer_covered_paths` remains a null-only
reserved API field. Custom is deferred. Unsupported values are rejected.

Results contain 1–3 options in deterministic engine order. HTTP 422 means invalid
input/profile or identical endpoints. HTTP 404 with `detail` identifies an unknown
pilot node or no valid route (Step-Free has explicit wording and no stairs fallback).
HTTP 503 means search capacity exceeded; unexpected calculation failures are logged
and return a sanitized 500. `GET /health` remains `{"status":"ok"}`.
Native Expo requests do not require CORS, so no cross-origin browser access is enabled.
Any future web client needs an explicit origin allowlist; no wildcard production policy is assumed.

From the root:

```powershell
./.venv/Scripts/python.exe -m uvicorn services.api.app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Expected: HTTP 200 with `{"status":"ok"}`. The pre-existing `/spikes/route` endpoint is a simulated technical fixture, not the production routing engine.

## Android Studio emulator

Start an emulator in Android Studio Device Manager. This machine has `Medium_Phone_API_37.0`. Set your actual SDK path and device serial:

```powershell
$env:ANDROID_HOME = 'C:/Users/SawJu/AppData/Local/Android/Sdk'
& "$env:ANDROID_HOME/platform-tools/adb.exe" devices -l
& "$env:ANDROID_HOME/platform-tools/adb.exe" -s emulator-5554 reverse tcp:8081 tcp:8081
npm start
```

The startup script uses IPv4-first localhost resolution. In another terminal, open Expo Go:

```powershell
& "$env:ANDROID_HOME/platform-tools/adb.exe" -s emulator-5554 shell am start -a android.intent.action.VIEW -d 'exp://127.0.0.1:8081'
```

If Expo Go is not installed, `npm run android` can install/open the SDK-compatible version. Stop an already running Metro server before running that command. The helper resolves Expo whether npm nests or hoists workspace dependencies.

First launch shows onboarding; complete or skip it to reach Planner. Use bottom navigation for Community and Profile. Development builds expose Profile → Restart onboarding demo and isolated stress previews. These do not reset community routes or barrier reports.
The routing API must be running for route results; location permission, login and a database are not required.

## Physical Android phone

Install SDK 57-compatible Expo Go, connect by USB, enable USB debugging, and approve the computer on the phone. Use its serial from `adb devices -l` in place of `emulator-5554` in the ADB commands above. Emulator and phone can use the same local Metro server via separate reverse mappings. Physical-phone verification is tracked separately from emulator results.

## Quality gates

From the root:

```powershell
npm run lint
npm run typecheck
npm test
./.venv/Scripts/python.exe -m ruff check services/api
./.venv/Scripts/python.exe -m pytest services/api/tests
```

`npm run check` runs the three mobile gates sequentially. App-specific equivalents are `npm run lint --workspace mobile`, `npm run typecheck --workspace mobile`, and `npm test --workspace mobile` (or `npm --prefix apps/mobile run <script>`).
Jest covers the typed HTTP boundary, real planner, onboarding/restart, Profile editing, repository persistence, sharing/reporting validation and verification rules, photo recovery and stress fixtures.
API tests cover the domain, HTTP route contract, health and preserved Phase 0 spike.

Additional Expo checks:

```powershell
npm exec --workspace mobile -- expo install --check
npm exec --workspace mobile -- expo export --platform android
```

## Layout

```text
apps/mobile/src/app/(main)/   Planner, onboarding-linked flows, Community, Profile and navigation
apps/mobile/src/app/spikes/   Preserved Phase 0 map spike
apps/mobile/src/components/   Shared native form, button, summary and shell primitives
apps/mobile/src/features/     Planner, preferences, community, barriers and dev QA
apps/mobile/src/services/     Typed routing and injectable local storage services
apps/mobile/__tests__/        User-flow, repository and routing tests
services/api/app/             FastAPI application
services/api/tests/           Pytest checks
supabase/                    Reserved; no integration yet
scripts/                     Workspace CLI helper
docs/demo/                   Verification evidence and known limitations
.harness/                    Instructions, living plan, checklist
```

## Known limitations

- Phase 0 map rendering remains unresolved. Opening the spike is not proof that tiles and route overlays work. Standalone Android map builds will require a restricted Google Maps Android SDK key; no credential is needed for this shell.
- Git is initialized at the project root with origin `https://github.com/aanatidae/jomapplication`. The template's original nested metadata is preserved in ignored `.local/git-metadata/mobile.git`. Commits use the human maintainer's identity; pushes require explicit user approval. The user authorized publication of the current Phase 0/1 work on 2026-10-15.
- Phase 0 dependency audit findings remain open; Jest adds development dependencies with further transitive findings. Do not run `npm audit fix --force` across Expo SDK boundaries. Evidence is under `docs/demo/`.
- This host's sandbox can hide the SDK, block localhost sockets, stall TestClient, or deny Hermes temp output. Use an ordinary developer terminal when those sandbox restrictions occur.

# Jom!

A pedestrian-first route-planning hackathon MVP: **same origin, same destination,
different need, different best route**. Fastest, Safer at Night and Step-Free are
computed by FastAPI/NetworkX. The Expo Android app renders **real Brickfields
OpenStreetMap routes**, compares explanations/data confidence,
and supports foreground GPS walking navigation, guest preferences, community sharing, photos and barrier reports.

**Safer based on available data.** Environmental indicators are not guarantees.
The 2 km geographic pilot has incomplete, unverified safety/accessibility data.
Step-Free is unavailable when critical evidence is missing. Safer at Night returns an explicit insufficient-evidence error when environmental indicators are absent; neither profile silently falls back to Fastest. This is not a
production-ready mobility service. See [Brickfields setup, source, refresh,
licensing and limitations](docs/brickfields/README.md).

## Architecture and scope

| Part | Responsibility |
| --- | --- |
| Expo SDK 57 / React Native / TypeScript | Interactive Leaflet/OSM map, optional native map, typed API boundary, accessible controls and reduced motion |
| FastAPI / Pydantic / NetworkX | Deterministic graph routing, exclusions, scoring, reasons and confidence |
| Supabase Auth / Postgres / Storage | Anonymous guest sessions, private preferences, owned writes, public published community reads/photos |
| Explicit local mode | Separate device-only community/preferences/report persistence; never automatic failover |

Routing owns no Supabase write side effects. Reports never automatically change the
pilot graph. The default trip is KL Sentral south entrance → NU Sentral main
entrance. The historic **8/10/12-minute** scenarios remain explicit simulated
test fixtures. Supported saved needs can
legitimately change these results. Covered/shaded and ramp/elevator preferences
remain visibly saved-only. Guest identity survives restart; clearing app storage
loses it. Foreground location is opt-in; manual map/landmark selection works
without permission. No IC number, age inference or automatic route history.

## Geographic pilot quick start

The real OSM extract and derived graph are checked in; route requests work
without downloading OSM. Start the existing API and Expo using the commands
below. The default Leaflet renderer needs no map key. For native maps, set
`EXPO_PUBLIC_MAP_RENDERER=native`; Android custom builds additionally require
`GOOGLE_MAPS_ANDROID_API_KEY` in the build environment.

Apply `supabase/migrations/202610190001_geographic_snapshots.sql` to your existing
Supabase project before sharing geographic routes/reports. It preserves old
schematic content and existing security/verification rules. Hosted migration
application requires an administrator session; a public app key cannot apply it.

Request example:

```json
{"origin":{"latitude":3.1337503,"longitude":101.6867582},"destination":{"latitude":3.1331516,"longitude":101.687547},"profile":"fastest"}
```

Returned `WGS84` geometry is `[longitude, latitude]`, with snap distances and
uncertainty. Run `python -m scripts.verify_brickfields --api http://127.0.0.1:8000`
with the configured Python environment to compare three geographic HTTP trips
against the cached graph. Earlier demo-only examples below require explicitly
selecting `JOM_ROUTING_DATASET=simulated_demo`; they are not geographic results.

## Prerequisites

- Node 24.x, npm 11.x (tested 24.19.0 / 11.17.0), Python 3.11.
- Android SDK/platform-tools, Android Studio emulator or USB-debuggable phone.
- SDK 57-compatible Expo Go. Physical Android and iOS are development targets;
  current native verification is on the Android emulator only.
- Your own Supabase development project with anonymous sign-ins enabled and both
  tracked migrations applied, or Docker for an isolated local Supabase instance.
  No private configuration is included in a clone.

## Install and configure

From the repository root:

```powershell
npm ci
python -m venv .venv
./.venv/Scripts/python.exe -m pip install -r services/api/requirements-lock.txt
Copy-Item .env.example apps/mobile/.env.local
```

Use the single root `package-lock.json`; do not install separately in the app or
create another lockfile. On macOS/Linux use `.venv/bin/python` instead.

Edit the copied file with values from your own development project:

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_SUPABASE_URL=<your project URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<public anon or publishable key>
EXPO_PUBLIC_DATA_MODE=supabase
```

The existing ANON_KEY variable accepts either public format. `EXPO_PUBLIC_*` values
are bundled; never supply a service-role/secret key, database password or personal
access token. `.env.local` and `.local/` are ignored. Restart Metro after changes.
Both environment examples contain only empty credentials and public setup values.

For a planned device-only demonstration without Supabase, explicitly set
`EXPO_PUBLIC_DATA_MODE=local` before starting Metro. The UI labels local storage;
local data is separate and never synced to Supabase. FastAPI is still required.
Missing hosted configuration should be fixed, not bypassed with privileged keys.

## Supabase setup and migrations

Follow [supabase/README.md](supabase/README.md) for local Docker commands, hosted
CLI authentication/linking, dry-run migrations, or the transactional bootstrap for
a **confirmed empty development project**. Apply migrations `202610170001` and
`202610170002` and enable anonymous sign-ins. Tables, RLS, owner/verification
guards, JSON validation and the public-read image bucket are migration-owned.

`supabase/seed.sql` inserts three labelled synthetic community routes idempotently.
The additional public-client demo setup below needs no administrator credential or
dashboard edits once migrations/auth are configured. Neither command updates the
routing graph. Do not run remote database resets. Local `supabase db reset --local`
is destructive to its local instance; inspect the target and preserve needed data.

## Run API and mobile

Terminal 1, root:

```powershell
./.venv/Scripts/python.exe -m uvicorn services.api.app.main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2, root:

```powershell
npm start
```

Start your emulator/device, then configure reverse ports and open Expo Go:

```powershell
adb devices -l
adb -s <serial> reverse tcp:8000 tcp:8000
adb -s <serial> reverse tcp:8081 tcp:8081
adb -s <serial> shell am start -a android.intent.action.VIEW -d exp://127.0.0.1:8081
```

Use your actual serial and Metro port. For another port, start with
`npm run start --workspace mobile -- --port 8082` and reverse/open 8082.
`npm run android` can install/open compatible Expo Go when the SDK is configured.
The included helper uses IPv4-first localhost resolution and handles workspace
module resolution. Set `ANDROID_HOME` to your own Android SDK path if needed.

Without reverse, Android Emulator can use API `http://10.0.2.2:8000`. A Wi-Fi phone
needs the computer's LAN address and Uvicorn `--host 0.0.0.0`; allow the port only
on a trusted development network. Metro connectivity is separate from API access.
Localhost on a phone refers to the phone. Use HTTPS for any deployed service.

Choose **Continue as guest**, complete/skip onboarding, then Planner. Profile edits
apply only after Save preferences. Community and Reports require hosted connectivity
in normal mode. Photos are public: use only non-personal JPEG/PNG/WebP under 10 MB.

## Demo setup, repeat and recovery

```powershell
npm run demo:routes
npm run demo:seed
npm run demo:check
```

`demo:routes` exercises live health, all three profiles three times and invalid
inputs. `demo:seed` inserts one labelled community and one barrier fixture only
when absent, using a dedicated ordinary guest. IDs/session persist in private,
ignored `.local/demo-session.json`. Repeated seeds reuse those IDs; a local lock
rejects concurrent setup. Do not publish, copy between projects or delete the
manifest to reset. A stale lock may be removed **only after confirming no setup
process is running**. `demo:check` checks the saved fixtures without content writes;
restoring auth can refresh tokens and update the manifest. No remote reset exists.

For repeat presentations, reset/save **your own** preferences, select Transit Stop
and Residential Block, and reuse existing labelled rehearsal posts. No source or
database edits are needed. See the exact [A/B/C/D walkthrough and recovery
runbook](docs/demo/demo-scenarios.md), [known limitations](docs/demo/known-limitations.md)
and [final verification](docs/demo/phase14/results.md). Proposed five-minute timing
still needs a spoken rehearsal on the judging device/network.

## HTTP contract

`GET /health` returns HTTP 200 and `{"status":"ok"}`.
`POST /v1/routes` accepts:

```json
{"origin":{"node_id":"transit_stop"},"destination":{"node_id":"residential_block"},"profile":"safer_at_night"}
```

Profiles: `fastest`, `safer_at_night`, `step_free`. Optional aware `departure_time`
is metadata, not live conditions. Supported strict preferences are
`prefer_well_lit`, `avoid_stairs`, `avoid_steep_slopes`, `prefer_public_areas` and
integer `max_detour_minutes` (0–60). No coordinate snapping/geocoding. Identical
endpoints/invalid values return 422; unknown nodes/no valid route return 404;
capacity failure 503; unexpected failures use a sanitized 500.

Responses include `dataset_id`, `data_kind: SIMULATED_DEMO`, `reference_time` and
1–3 routes. Geometry is `LineString` with `local_metres_not_geographic`; distance
is metres and time seconds. Mobile only projects coordinates for its schematic.
Reasons, warnings, confidence and verification/provenance come from the backend.
Unknown verification dates remain unknown. The static dataset's assessment clock
is fixed; departure time does not update it. The typed client rejects malformed
responses, uses a 10-second timeout, aborts obsolete requests and offers Retry.
Native Expo does not need CORS; no wildcard browser access is enabled.

## Quality gates

```powershell
npm run check
./.venv/Scripts/python.exe -m ruff check services/api
./.venv/Scripts/python.exe -m pytest services/api/tests
npm run demo:routes
node --env-file=apps/mobile/.env.local scripts/verify-supabase.mjs
npm exec --workspace mobile -- expo install --check
npm exec --workspace mobile -- expo export --platform android
```

`check` runs mobile lint, strict TypeScript and Jest. Individual scripts are `lint`,
`typecheck`, `test`, with workspace variants. Backend tests verify closures,
Step-Free hard exclusions, unknown access, deterministic ordering, truthful reasons
and HTTP contract. Live Supabase tests use two disposable guest identities and the
public key, test actual ownership/verification/Storage restrictions and persistence,
then remove their own content. Auth identities remain for administrator cleanup.

Android export validates bundling, not an installed signed release. Dependency
advisories/Expo patch suggestions are tracked in the final report; no forced SDK
upgrade is part of setup. `npm ci` is the reproducible install. This host's sandbox
can block sockets, SDK access or Hermes temp writes; use a normal developer terminal
if those restrictions affect tests.

## Repository layout

```text
apps/mobile/src/app/        Expo Router screens and preserved map spike
apps/mobile/src/features/   Planner, preferences, community, barriers, quality, motion, isolated QA
apps/mobile/src/components/ Shared native primitives
apps/mobile/src/services/   Typed API, Supabase/auth/images, explicit local repositories
apps/mobile/__tests__/      Component, flow, boundary and persistence tests
services/api/app/           HTTP models, routing engine/scoring/explanations/confidence
services/api/data/pilot/    Labelled synthetic pedestrian graph
services/api/tests/         Domain, HTTP and quality tests
supabase/                  Config, two migrations, seed and setup guide
scripts/                   Expo helper, demo setup and integration checks
docs/demo/                 Runbook, screenshots, verification and limitations
.harness/                  Instructions, living execution plan and checklist
```

The default geographic map uses bundled Leaflet/OSM; the optional native Google
provider requires a correctly authorized build key. No production moderation, route verification operations,
anonymous-account recovery, full pagination, automated orphan cleanup or release
performance assurance. Current evidence distinguishes real end-to-end checks from
fixtures and manual follow-ups. Git publication requires explicit approval for each
push to the authorized repository.


## Foreground walking navigation

1. In Planner, tap **To** to search the five mapped Brickfields landmarks, or use **Set destination on map** in the comparison sheet. Search is a local landmark catalogue, not city-wide geocoding.
2. Choose a manual start with **From** / **Set start on map**, or tap **Use current location** (shown as **Locate** at large font sizes). An existing foreground grant lets Planner show your location without prompting on launch. Being in Brickfields is never assumed.
3. Choose Fastest, Safer at Night, or Step-Free. Compare and select alternatives; this does not start tracking. Scroll the comparison for full reasons, confidence, endpoint gaps and warnings. Preferences from Profile apply to every supported profile. Avoid stairs / avoid steep slopes can legitimately leave no route when critical data is unknown. Covered/shaded and ramps/elevators remain explicitly saved-only; there is no Custom profile.
4. Press **Start**. Grant foreground **precise** location and enable device location services. Jom! obtains a fresh fix, then subscribes to walking GPS updates. If you are away from the preview, the API recalculates from your actual location with the same profile/preferences. It never draws an invented connector to your manual origin.
5. The blue puck uses device coordinates and shows reliable compass heading where available. The grey path is the full route; teal shows the remaining path. Distance/ETA use projection along its geometry. Pan or zoom to explore, then **Recenter** to resume following. The default Leaflet map stays north-up; optional native maps can orient to heading.
6. **Stop Navigation** ends subscriptions and cancels pending reroutes. Arrival needs repeated accurate fixes near both the route end and chosen destination. **Return to Planner** returns to preview.

Only foreground navigation is implemented. Going to the background pauses location/heading subscriptions and pending requests; returning to the foreground rechecks permission/services/current position before resuming. Leaving Planner stops the session. Process termination, Expo reload and Android activity recreation end the in-memory session; press Start again. No background service, voice turns, reliable turn-by-turn maneuvers or route history is implemented.

GPS with unknown accuracy or worse than 35 m cannot drive navigation; manual planning still works with denied/approximate location. Stale readings and implausible jumps do not advance progress. No recent update can mean stationary movement or signal loss; the UI says so. Three reliable off-route readings spanning at least 6 seconds and more than max(35 m, 1.5 times accuracy) trigger rerouting, at most once per 20 seconds. Failed reroutes keep the profile and offer Retry. Walking ETA uses the graph's estimated walking speed, not a personalized measured pace.

The graph covers a 2 km pilot; snapping is limited to 75 m. Outside/unreachable positions produce a useful error. Navigation additionally requires being within 35 m of the mapped route, and unmapped endpoint gaps are never counted as walked paths. The cached real graph currently cannot establish a strict Step-Free or evidence-backed Night recommendation for the default trips. Valid-profile behavior is tested on the explicitly simulated fixture; real safety/accessibility data must be surveyed before those profiles can be field-validated.

### Android Studio location testing

Start the loopback API and Metro using the commands above. With ADB reverse, set `EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` and reverse both API 8000 and Metro 8081. Without reverse, an Android Studio emulator can use `http://10.0.2.2:8000`; `localhost` on Android refers to Android itself. A physical phone needs USB reverse or an explicitly configured reachable host address.

Use Android Emulator **Extended controls > Location** to set latitude/longitude. For the default trip, start at latitude **3.1337503**, longitude **101.6867582**. Press Start in Jom!, then change locations or load `docs/navigation/brickfields-walk.gpx`. These are simulated emulator readings, delivered through the normal Expo location subscription.

A repeatable ADB alternative (override `--adb` and `--serial` on other machines):

```powershell
./.venv/Scripts/python.exe scripts/simulate_walk.py --prepare
# Set the emulator to the printed first point, allow its GPS to settle, then tap Start.
./.venv/Scripts/python.exe scripts/simulate_walk.py --replay
```

The script requests real API geometry, exports GPX and sends walking-speed fixes every 3 seconds. It never animates app state. `docs/navigation/results.md` distinguishes actual emulator verification, automated tests and untested physical-device behavior. The development-only `/spikes/navigation-qa` screen provides Demo data / Worst case / GPS unavailable / Recalculating / Arrived UI fixtures, clearly labelled as static UI previews without GPS.

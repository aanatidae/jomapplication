# Jom!

Pedestrian-first walking route planning. Project guidance lives in `.harness/AGENTS.md`, `.harness/PLAN.md`, and `.harness/TODOLIST.md`.

## Current scope

Phase 1 provides a plain Expo Router shell with reachable Planner, Community, and Profile screens, plus the FastAPI health endpoint and quality gates. Routing profiles, persistence, production UI, and animations are later phases. The simulated Phase 0 map spike is preserved at `/spikes/map`; its blank map tiles/overlays remain an unresolved Phase 0 issue.

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

No credentials or environment files are required for Phase 1. `.env.example` documents a future public API URL; it is not yet consumed. Expo client values belong in `apps/mobile/.env.local` when API integration is added. Never put server secrets in `EXPO_PUBLIC_*` values.

## Start the API

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

Planner opens by default. Use bottom navigation to reach Community and Profile, then return to Planner. No location permission, login, external API, or database is required.

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

`npm run check` runs the three mobile gates sequentially. App-specific equivalents are `npm run lint --workspace mobile`, `npm run typecheck --workspace mobile`, and `npm test --workspace mobile` (or `npm --prefix apps/mobile run <script>`). Jest tests exercise Router navigation and direct entry to Community/Profile; API tests check health and preserve Phase 0 regression checks.

Additional Expo checks:

```powershell
npm exec --workspace mobile -- expo install --check
npm exec --workspace mobile -- expo export --platform android
```

## Layout

```text
apps/mobile/src/app/(main)/   Planner, Community, Profile and navigation shell
apps/mobile/src/app/spikes/   Preserved Phase 0 map spike
apps/mobile/src/components/   Shared shell component
apps/mobile/__tests__/        Router tests, outside the routes directory
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

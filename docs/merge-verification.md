# Android Studio and Wayne UI integration

Verified on Windows on 2026-10-22 (Asia/Kuala_Lumpur).

`feature/wayne-ui` now includes the Android Studio project and Windows path fixes
from `feature/androidstudio`. Merge commit: `2e1beae`. The merge had no conflicts.
The original heads `66576ba` (Wayne UI), `7d21d3d` (Android Studio), and `ae674f2`
(`origin/main`) are all ancestors of the merged branch. No branch history was
rewritten and no branches were deleted.

## Automated checks

| Check | Result |
| --- | --- |
| `npm run check` | Passed: Expo lint, TypeScript, 153 tests in 21 Jest suites |
| `.venv/Scripts/python.exe -m pytest -q -o faulthandler_timeout=120` | Passed: 156 tests, one existing Starlette/httpx deprecation warning |
| `.venv/Scripts/python.exe -m ruff check services/api` | Passed |
| `gradlew.bat prepareKotlinBuildScriptModel :app:assembleDebug "-PreactNativeArchitectures=arm64-v8a,x86_64" --max-workers=2 --console=plain` | Passed: 395 tasks; 43 executed, 352 up-to-date; 10m34s |
| `git diff --check` | Passed |

The native check includes Expo, Reanimated, and Worklets IDE helper tasks, covering
the Windows path-with-spaces sync fix. Gradle selected the configured Temurin JDK
17. Debug APK: `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk`,
144,881,465 bytes, SHA-256
`95971640e6b985fefa63b759f85a109d47c1e6268d3210fd2c5e985f4071844e`.

The initial sandboxed Jest run could not write transform-cache files, and the
sandboxed FastAPI test run stalled. Both complete suites passed when rerun with
the required local filesystem/socket access. These were test environment issues;
no application code or dependencies were changed to bypass them.

## Live routing API

The merged API was started on `127.0.0.1:8000` with the real cached OpenStreetMap
dataset. Read-only HTTP checks passed:

| NU Sentral to MCKL case | Distance | Walking time |
| --- | --- | --- |
| Normal | 468.77 m | 375.02 s |
| Allowlisted simulated crossing closure | 515.31 m | 412.25 s |
| Reset closure | 468.77 m | 375.02 s |

Reset restores identical route data and snapped endpoints, allowing the expected
per-request confidence assessment timestamp to advance. Health and crossing
metadata returned 200. Safer at Night and Step-Free returned explicit 404
unavailable responses; an arbitrary closure identifier was rejected with 422.

## Native emulator smoke test

The freshly built APK was installed on `Medium_Phone_API_37.0` (`emulator-5554`,
x86_64). The actual native app, `com.aanatidae.jom`, loaded the merged JavaScript
from Metro in explicit local persistence mode. Verified through ADB UI hierarchy,
screenshots, and the running API's request logs:

1. First-run onboarding opens; Skip setup reaches Wayne's compact Planner UI.
   Leaflet tiles, mapped endpoints, and the default 316 m route render.
2. Origin/destination pickers select NU Sentral and MCKL. The real backend route
   displays 469 m and 7 min.
3. Report Barrier opens the session-only demo form. Confirming a demo report leaves
   it unverified; explicit activation produces the red X, calculated alternative
   notice, and 515 m / 6 min 52 sec metric.
4. Clear demo blockage removes the simulation. The normal 469 m route returns.
5. Start navigation prompts for Android foreground precise location. With an
   explicitly simulated emulator fix near NU Sentral (longitude
   101.68764791886117, latitude 3.1331550708543014), native navigation reaches
   Follow the route, approximately 453 m remaining, and ±5 m location accuracy.
6. Opening Report Barrier and Return to map preserves the active walk.
   Stop Navigation returns to the normal 469 m Planner preview. Android location
   diagnostics then show fused/GPS providers OFF with no app listener remaining.

The first launch during compilation timed out. The restored emulator snapshot
also exhibited Android system-service failures. A cold boot and Metro cache
refresh were needed; initial bundling took 88.6 seconds, and the subsequent cached
launch bundled in 3.7 seconds and completed the checks above. These timings are
environment observations, not application performance benchmarks. The emulator,
API, and Metro are left available for review with navigation stopped and the
simulated closure cleared.

## Scope and existing limitations

- Runtime checks use explicit local persistence mode; no hosted Supabase records
  are created or modified. Hosted authentication/submissions, physical phones,
  continuous walking/arrival, outdoor GPS, signed releases, and Android Studio GUI
  import are not covered.
- An additional `ruff check services/api scripts` scan found 19 existing issues
  in four unchanged helper scripts (`navigation_qa.py`, `simulate_walk.py`,
  `vendor_leaflet.py`, and `verify_brickfields.py`). The API lint check passes.
- Full Android `lintDebug` is not claimed as passing or rerun here. The pre-existing
  Worklets Kotlin UAST failure is documented in `android-studio.md`.
- Gradle and native dependency deprecation warnings remain; they do not prevent
  the verified debug build.

Raw test/build/server logs and HTTP evidence are kept locally under ignored
`.local/merge-*` paths.

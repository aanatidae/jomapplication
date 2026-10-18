# Phase 14 final quality gates — 2026-10-18

**Status: Complete within the documented Android emulator / available-tooling scope. Overall: ready for the controlled hackathon demo, not production deployment.** Phase 13 was verified and recorded before Phase 14 began. No feature expansion or dependency changes were needed.

## Executed gates

| Gate | Actual result |
| --- | --- |
| `npm run check` | Expo lint, strict TypeScript, **97 tests / 15 suites pass**, including a final run after the header fix |
| API Ruff / Pytest | **Ruff passes; 121 tests pass**; one existing Starlette/httpx deprecation warning |
| Live health / routing smoke | HTTP 200 health; 8/600, 10/720, 12/830; three identical requests/profile, distinct geometry and 422/404 invalid-input handling |
| Real Supabase integration | Two authenticated guests pass ownership, immutable verification, public reads, private profiles, session/preferences, expiry and Storage checks; test content removed |
| Android production export | Final source exports **1,739 modules / 4.6 MB Hermes bundle**; no installed signed-release claim |
| Source / history credential review | No credential material detected by targeted scan plus manual environment/logging review; limits and dependencies in security-review.md |
| Bundle credential check | Hermes disassembly shows the exact `sb_secret_` rejection literal, not a privileged key. A naive raw regex crossed adjacent Hermes string-table entries; resolved using actual string boundaries. Configured public key was independently validated |
| Script / whitespace checks | Both new Node scripts parse; repeated seed/check pass; held-lock refusal preserves the manifest and reset/extra arguments are rejected before network; `git diff --check` passes |
| Design detector | Changed Planner target returns no mechanical findings; screenshot verification still required and performed |

The **dependency audit is not clean**: 65 propagated package records (50 high/15 moderate) in the working installation; clean install reported 64 (49 high/15 moderate). Expo compatibility check suggests two patch updates. Audit-fix dry-run fails peer resolution. No forced installation, SDK jump, override or lockfile change was made. See [security review](security-review.md) for five underlying advisories, actual exposure assessment and production follow-up. These are not hidden behind passing unit tests.

## Actual capability / contract review

| Capability | Evidence and limits |
| --- | --- |
| Planner / places / comparison | Native launch, change destination to Community Mall (9-minute result), restore Residential Block, change origin to identical endpoint and recover; profile/option selected states and geometry update |
| Fastest / night / Step-Free | Actual FastAPI calls and native geometry/metrics. Baseline 8/10/12 requires all needs off/no detour. Night +2-minute trade-off, lighting/public/staffed-point reasons and Medium confidence visible. Step-Free 12/830, no-stairs/ramp/curb/entrance reasons; strict exclusions, closures and unknown access covered by API tests |
| API boundary | TS/Pydantic profile names and node IDs agree; local-metre LineString projection, seconds→minutes, metres, reasons/warnings/confidence and nullable verification metadata agree. Client tests reject malformed/wrong-profile responses, timeouts and HTTP failures without crashing; source validation also rejects duplicate IDs |
| Onboarding / preferences | Native three-step onboarding in clean-copy local mode, editable needs/save, restored prior local needs; mocked boundary and actual hosted two-user restart tests. No IC/age inference |
| Hosted community / photos | Phase 13 native selected snapshot → form → real publish → detail/public image → restart; correct notes independently read back. Final app reopens saved notes. Both deliberate posts remain Community submitted |
| Hosted barrier / history | Native route waypoint/category/temporary details/review → persist → restart; independent row/24h-expiry readback. Final history shows active/unconfirmed and verification unknown. Optional native report photo omitted; both Storage prefixes tested live |
| Failures / local mode | Actual API-port outage and Supabase internet outage error/retry tested in Phase 13. Component tests cover empty, no-route, failed write/photo and preserved draft. Clean copy visibly labels local mode; no silent local/hosted mixing |
| Auth / privacy / integrity | Existing guest survives force-stop; actual anonymous auth and two-user restrictions exercised. Safety/unknown/verification copy reviewed; no guarantees, demographic risk or automatic community promotion |

## Accessibility, UI and motion

Final break-ui checks reused isolated Worst case fixtures (100-character title, 2,000-character notes/report, long names/tags, missing images/dates), actual Planner and the real hosted flows. Android emulator at **320dp × 640dp, 200% text** verified scroll access, stacked navigation, keyboard-visible editing and non-colour selected/route/status indicators. Controls retain 48dp tokens; labels, radio/tab checked/selected/expanded states and reading order were inspected in source, component tests and native UI trees. Native viewport clipping at a ScrollView boundary is scrollable content, not hidden permanent data. Spoken TalkBack/VoiceOver was not run.

**Fixed:** the actual Planner header metadata had no flex-shrink constraint, clipping “Walking · Simulated pilot” at 200% text. Added the same constrained wrapping approach already used by its demo counterpart; final native image shows the full subtitle. Also completed the app-level environment example (API URL/data mode were missing) and changed the development display name to Jom!; slug/scheme remain stable. No new UI style, animation, library or architecture.

Motion review:

| Before | After | Why |
| --- | --- | --- |
| Existing 120/100ms press feedback, 180ms occasional steps, opacity-only map selection | Retained | Source review finds transform/opacity only, custom ease-out, immediate functional geometry/text, live Reduce Motion and cleanup; no new motion to justify |

**Approve for source and observed Android functional behavior.** OS reduced-motion live state and a repeated cold launch worked. Physical haptic feel, iOS, release FPS/memory are unmeasured. One Expo Go development startup/config-switch stall occurred; clean bundle/relaunch recovered. Repeated cold launch worked, no application fatal crash appeared in the inspected crash buffer. Old UIAutomation service-registration crashes belong to overlapping automation, not the app. Warm the presenter build before starting; do not switch two development projects mid-pitch.

Performance review found bounded 100-row hosted reads, 20-at-a-time community rendering, one capped photo/submission, cancellation/stale-response guards and preference-aware route cache. Repeated navigation/profile changes, images and API/Supabase requests worked. No new profiler measurements, FPS, memory budget or production-scale claims. No demonstrated scoped P0 or significant P1 remains. Minor caveats: just-created server timestamps can briefly appear unknown until the 30-second clock refresh; Expo Go dev-host switching can require a cold relaunch; inherited dependency advisories remain open.

## Fresh-start verification

Created `.local/phase14-fresh` as a separate current-source copy from tracked files plus this task's new scripts/docs. No `.env.local`, sessions, node_modules, venv or Git metadata copied. This is an **isolated working-source equivalent**, not a claim that unpublished changes were cloned from GitHub. The root lockfile SHA-256 matches the source copy; `npm ci` installed 1,076 packages without forced peer options. A new Python venv installed the pinned requirements. Its own mobile lint/types/97 tests and Ruff/121 tests pass.

Copied only the public environment example, then explicitly selected local persistence and API port 8001; no real Supabase credentials were copied. The clean-copy API started on 8001, health/live route smoke passed, Metro started on 8083, Android exported and Expo Go launched. Actual native profiles again returned 8/10/12 after clearing that emulator's existing local preferences. Three-step onboarding was exercised, then the prior local needs restored. Existing emulator storage means this is not a claim of a newly wiped device. Switching live Metro experiences initially failed; force-stopping Expo Go and opening only the intended server resolved it.

Hosted provisioning is an external prerequisite: no Docker daemon or fresh administrative Supabase credentials were available, so migrations were **not reapplied to a new remote/local database**. Both tracked migrations/setup instructions were reviewed, and the existing hosted schema was exercised with real public-key security/content tests. A new developer obtains their own project URL/public key, enables anonymous sign-in, reviews migration targets/dry run and follows supabase/README.md. A second human onboarding review remains manual. No private setup file is implied to exist in a clone.

## Final walkthrough and evidence index

Phase 13 exercised complete native share/photo/report writes, restart persistence and outages. Phase 14 repeated routes, endpoint changes, Step-Free, saved route detail, report history and onboarding against final source. Repeat walkthrough reuses the labelled posts rather than creating unlimited duplicates. No source/dashboard edits or data reset is needed while presenting. **Five-minute spoken timing is proposed, not measured**; presenter rehearsal on the judging device/network remains required.

Useful PNG/XML pairs:

- `../phase13/fastest`, `../phase13/night`, `final-step-free`: actual selected geometry and profiles.
- `final-night-comparison`: selected 10 min/720 m, +2 min, reasons, Medium confidence, unknown verification and simulated warnings.
- `../phase13/shared-photo-persisted`, `final-shared-notes`, `../phase13/community-after-restart`: real uploaded image, notes and feed.
- `../phase13/report-location`, `../phase13/report-review`, `../phase13/report-success`, `final-report-history`: native report through persisted history.
- `planner-large-final` versus `cold-start-reduced` (before wrapping fix); `share-large-keyboard`, `barrier-large-details`, `community-large-content`: final stress evidence.
- `fresh-fastest`, `fresh-night`, `fresh-step-free`, `fresh-local-community`, `fresh-onboarding`: isolated-copy launch/routes and explicit local label.
- `../phase13/api-unavailable`, `../phase13/api-recovered`, `../phase13/supabase-error`, `../phase13/supabase-recovered`: genuine outage/retry.

Runbook: [demo-scenarios.md](../demo-scenarios.md). Limits: [known-limitations.md](../known-limitations.md). Root README now covers actual architecture, environment, clean install, API/Expo/Supabase setup, seed/repeat/recovery and quality commands. Historical PRODUCT.md/DESIGN.md remain Phase 2 snapshots; the harness/current implementation/README govern final behavior. Updating those optional design records requires their own scoped `impeccable init` workflow, not an inferred rewrite during QA. Original local/hosted needs and display settings were restored; the final hosted preference restore was asserted after restart. Planner now legitimately shows 10 minutes with those needs; follow the runbook reset/save for the 8-minute baseline. Temporary clean-copy servers were stopped. No commit or push.

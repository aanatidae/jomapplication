# TODOLIST.md

This is the implementation checklist for Jom!. `PLAN.md` explains the architecture, reasoning, milestones, and acceptance criteria. This file tracks concrete work.

Rules for Codex:

- Push only to `https://github.com/aanatidae/jomapplication`, and only after the user gives explicit full consent and approval for the push. On 2026-10-15 the user authorized committing and pushing the current Phase 0/1 work; this is not standing approval for future pushes.
- Work in phase order unless a dependency requires a small earlier spike.
- Do not mark an item complete until its acceptance evidence exists.
- Update `PLAN.md` whenever an important design or architecture decision changes.
- For UI tasks, read the relevant installed skills listed in `AGENTS.md` before implementation.
- Before a phase is marked complete, run its tests and manually inspect the user-visible behavior.
- Do not fabricate real-world safety/accessibility data. Use clearly labelled simulated data until verified pilot data exists.

## Phase 0 — Repository audit and technical spikes

Native verification targets: **Android Studio emulator + physical Android phone**, with Expo Go permitted for testing (user-confirmed 2026-10-15). Check ADB connectivity before claiming mobile/map acceptance.

- [x] Inspect Git status and preserve all unrelated user changes.
- [x] Inventory current files, packages, app entry points, and existing prototypes.
- [x] Determine whether the repo is empty, partial, or already has a preferred stack.
- [x] Read `AGENTS.md` fully.
- [x] Read `PLAN.md` fully.
- [x] Read `mobile-native/SKILL.md`.
- [x] Read `impeccable/SKILL.md`.
- [x] Read `ui-skills-root/SKILL.md`.
- [x] Read `emil-design-eng/SKILL.md`.
- [x] Read `apple-design/SKILL.md`.
- [x] Read `pick-ui-library/SKILL.md`.
- [x] Read `prototype/SKILL.md`.
- [x] Verify the current Expo SDK if Expo is used.
- [ ] Run a small map-rendering spike on the target Expo environment.
- [x] Run a FastAPI + NetworkX route-response spike.
- [x] Record map-library decision in `PLAN.md` Decision Log.
- [x] Record any stack changes in `PLAN.md`.
- [x] Update `PLAN.md` Context and Orientation with actual repository paths.

Evidence (2026-10-15): API 3 tests + Ruff pass; mobile lint/typecheck, Expo install check, Doctor 21/21 and Android Hermes export pass. Expo Go screen opens and emits Native map ready on Android Studio AVD. Map tiles/markers/polyline are still blank, so map acceptance remains unchecked. Screenshot: `docs/demo/emulator-phase0.png`. Physical phone not connected.

### Phase 0 acceptance

- [x] Mobile spike opens without crashing.
- [ ] Map or approved map fallback renders.
- [x] API `GET /health` returns HTTP 200.
- [x] Tiny graph spike returns a route.
- [x] Baseline commands are recorded in `README.md` or `PLAN.md`.

## Phase 1 — Project scaffold and quality gates

- [x] Create/confirm root package/workspace configuration.
- [x] Create/confirm `apps/mobile`.
- [x] Configure Expo Router.
- [x] Enable TypeScript strict mode.
- [x] Configure ESLint.
- [x] Add stable `lint`, `typecheck`, and `test` scripts.
- [x] Create/confirm `services/api`.
- [x] Configure FastAPI.
- [x] Configure Ruff.
- [x] Configure Pytest.
- [x] Add `.env.example`.
- [x] Add `.gitignore` coverage for secrets, environments, build outputs, and local data.
- [x] Add Planner screen shell.
- [x] Add Community screen shell.
- [x] Add Profile screen shell.
- [x] Add health endpoint.
- [x] Add baseline API test.
- [x] Add root README startup instructions.

### Phase 1 acceptance

- [x] Mobile app starts locally.
- [x] API starts locally.
- [x] Mobile lint passes.
- [x] Mobile typecheck passes.
- [x] Mobile tests pass.
- [x] API Ruff check passes.
- [x] API Pytest suite passes.

Verified 2026-10-15: root npm ci and npm run check pass (3 navigation tests); API Ruff and Pytest pass (3 tests); localhost health returns HTTP 200 with expected JSON. Expo Doctor 21/21 and Android Hermes export pass. Planner, Community, Profile, and return to Planner exercised in Android Studio Expo Go; all three also reachable at 320dp width / font scale 2.0. Original device settings restored. Root env template and ignore rules verified. Evidence: docs/demo/phase1/. Phase 1 complete; Phase 0 map rendering and physical-phone validation remain separately open. No commit or push performed.

## Phase 2 — Design system and planner prototype

### Skill intake

- [x] Re-read `prototype` immediately before first high-fidelity flow.
- [x] Use `pick-ui-library` before adding a component library.
- [x] Apply `impeccable`, `mobile-native`, `apple-design`, `emil-design-eng`, and `ui-skills-root` to the design system.

### Design tokens

- [x] Define typography scale.
- [x] Define spacing scale.
- [x] Define radius scale.
- [x] Define elevation/shadow strategy.
- [x] Define neutral palette and one Jom! accent.
- [x] Define semantic safety/accessibility/verification tokens.
- [x] Define icon sizing rules.
- [x] Define touch-target rules.
- [x] Define reduced-motion behavior.

### Reusable components

- [x] Build primary button.
- [x] Build secondary/tertiary button.
- [x] Build icon button.
- [x] Build route profile chip/segmented control.
- [x] Build badge/tag.
- [x] Build confidence/verification badge.
- [x] Build place/origin-destination input.
- [x] Build bottom-sheet shell or chosen route-comparison container.
- [x] Build route option card.
- [x] Build route reason row/badge.
- [x] Build loading skeleton/progress state.
- [x] Build empty/error state primitives.

### Planner mock flow

- [x] Build map-first Planner layout.
- [x] Add origin selection UI.
- [x] Add destination selection UI.
- [x] Add Fastest profile.
- [x] Add Safer-at-Night profile.
- [x] Add Step-Free profile.
- [x] Add route comparison with 2–3 mock routes.
- [x] Show ETA and distance.
- [x] Show detour difference from fastest.
- [x] Show explanation reasons.
- [x] Show confidence/freshness.
- [x] Ensure map remains readable behind overlays.
- [x] Ensure one-handed control placement.

### Phase 2 QA

- [x] Read and apply `break-ui/SKILL.md`.
- [x] Test smallest supported phone size.
- [x] Test large font scaling.
- [x] Test long place names.
- [x] Test many route reasons.
- [x] Test empty route list.
- [x] Test dark/light system contrast if both modes are supported.
- [x] Verify no status depends only on colour.

Verified 2026-10-16: centralized native tokens and all required primitives exist; three profiles and selected geometry/cards, local place search, comparison expansion, demo quality/freshness and all degraded states exercised. `npm run check` passes lint, strict types and 14 mobile tests. Android Studio Expo Go QA covered 320dp × 640dp, 200% font scaling, long destination/confidence, many reasons, overlapping paths, keyboard and retry. Original settings restored. Light-only configuration retained, so dual-theme check is not applicable. Independent finish review: permission recovery corrected and scored resolved; scoped SHIP. Evidence: `docs/demo/phase2/results.md` and PNG/XML pairs. No physical phone or spoken TalkBack audit claimed. Native provider map acceptance remains Phase 0; later-phase checkboxes remain untouched. No commit or push performed.

## Phase 3 — Pilot graph and route engine

### Pilot data

- [x] Create deterministic simulated pilot graph fixture.
- [x] Clearly mark simulated fixture as demo data.
- [x] Add nodes for intersections/entrances/ramps/elevators/crossings.
- [x] Add at least three alternative paths for one demo trip.
- [x] Add a shortest-time path.
- [x] Add a longer better-lit/public path.
- [x] Add a step-free path.
- [x] Add at least one stairs edge.
- [x] Add at least one closed/blocked edge fixture.
- [x] Add at least one unknown-accessibility edge.
- [x] Add verification/confidence metadata.

### Routing modules

- [x] Implement graph loader.
- [x] Implement route-profile configuration.
- [x] Implement normalized edge penalties.
- [x] Implement `is_edge_allowed`.
- [x] Implement `edge_cost`.
- [x] Implement Fastest profile.
- [x] Implement Safer-at-Night profile.
- [x] Implement Step-Free profile.
- [x] Implement route generation.
- [x] Implement route ranking.
- [x] Implement route reason generation.
- [x] Implement route warning generation.
- [x] Implement confidence calculation.
- [x] Implement deterministic tie-breaking.

### Routing tests

- [x] Test Fastest chooses shortest ETA.
- [x] Test Safer at Night chooses better-lit route in demo scenario.
- [x] Test Step-Free excludes stairs.
- [x] Test closed path exclusion.
- [x] Test unknown accessibility reduces confidence.
- [x] Test route reasons reflect real edge attributes.
- [x] Test deterministic output for ties.
- [x] Test impossible route returns clear domain error.

Verified 2026-10-16: versioned SIMULATED_DEMO graph (11 nodes / 14 directed segments), strict loader, centralized prototype weights, exposure-normalized costs, NetworkX Yen candidates, deterministic cost/time/distance/segment-ID ties, hard traversal/accessibility constraints, derived reasons, warnings and weakest-edge data confidence. Same trip selects A=8min/600m, B=10min/720m, C=12min/830m in inspected offline CLI output. Unknown attributes stay unknown; Step-Free never silently falls back through stairs/unknown transitions. Ruff passes; Pytest 92 passed (89 new routing + 3 existing); mobile lint/typecheck/14 tests pass. Evidence and exact formulas: `docs/demo/route-fixture-notes.md` and `docs/demo/phase3-routing-results.txt`. Internal result/profile models exist; public HTTP contracts, /v1/routes and mobile integration remain later phases. No dependencies changed, no commit/push.

## Phase 4 — Routing API

- [x] Define `RouteProfile`.
- [x] Define `RoutePreferences`.
- [x] Define `RoutePoint`.
- [x] Define `RouteRequest`.
- [x] Define `RouteReason`.
- [x] Define `RouteOption`.
- [x] Define `RouteResponse`.
- [x] Implement `POST /v1/routes`.
- [x] Validate profile values.
- [x] Validate origin/destination.
- [x] Add node/coordinate snapping strategy.
- [x] Return 1–3 route options.
- [x] Return geometry.
- [x] Return ETA and distance.
- [x] Return reasons/warnings.
- [x] Return confidence and verification summary.
- [x] Add clean no-route response.
- [x] Add request/response API tests.
- [x] Document sample route request in README.

## Phase 5 — Mobile/API integration

- [x] Create typed routing API service.
- [x] Add environment-based API base URL.
- [x] Add planner state/hook/store.
- [x] Connect origin/destination to request model.
- [x] Connect profile selector to API request.
- [x] Render API route geometry.
- [x] Render route options from API.
- [x] Select a route from the comparison sheet.
- [x] Highlight selected route on the map.
- [x] Show API reasons.
- [x] Show warnings.
- [x] Show confidence.
- [x] Show last-verified state when present.
- [x] Implement loading state.
- [x] Implement timeout state.
- [x] Implement API error state.
- [x] Implement no-route state.
- [x] Implement retry.
- [x] Implement location-permission-denied state.
- [x] Ensure route scoring logic exists only on server.

### Phase 5 acceptance

- [x] Same trip returns visibly different route for Fastest vs Safer at Night.
- [x] Same trip excludes stairs in Step-Free.
- [x] UI explanation matches API response.
- [x] No manual code/data edit is needed during demo.

Verified 2026-10-16: Phase 4 passed independently before mobile integration. Final Ruff clean; 107 backend tests (15 HTTP contract + 92 preserved); npm run check passes lint/types/35 mobile tests. Native Android Studio Expo Go: default trip produces Fastest 8min/600m, Safer at Night 10min/720m, Step-Free 12min/830m and distinct selected geometry; real alternative selection, single-option result, unknown accessibility, no-route, network error/retry, 10-second timeout/retry and 320dp/200% text verified. Evidence: docs/demo/phase45/results.md, http-validation.json and PNG/XML pairs. No live location permission is used; manual origins always work and the existing denied-permission development preview is preserved. Node-only inputs, local schematic geometry, no silent fallback or scoring duplication. README/.env.example and PLAN progress/discoveries/decisions/outcomes updated. Physical phone/iOS/spoken TalkBack and Phase 0 geographic provider remain limitations, not claimed passes. No commit/push or later phases.

### Additional Phase 4/5 acceptance evidence

- [x] HTTP validates unsupported profiles, unknown endpoints, same nodes, aware timestamps and unsupported preferences.
- [x] Geometry, ETA, distance, reasons, warnings, confidence and verification summary returned in deterministic order.
- [x] No-route and Step-Free unavailability handled without a stairs fallback; unexpected errors sanitized; search budget returns 503.
- [x] GET /health still returns 200 with expected JSON; README documents the contract and native CORS decision.
- [x] Environment URL, typed client, 10-second timeout and malformed response checks verified.
- [x] Loading, timeout, API error, no-route, Retry and unknown accessibility tested at feature/HTTP boundaries.
- [x] Numbered API geometry, selected card/map emphasis and confidence/freshness verified natively.
- [x] Manual Fastest / Safer-at-Night / Step-Free scenarios pass without code/data edits.
- [x] Harness updated; all relevant backend/mobile gates pass.

## Phase 6 — Onboarding and preferences

- [x] Design onboarding with explicit user needs.
- [x] Add “prefer well-lit paths”.
- [ ] Add “avoid isolated routes” if supported by data. Deferred: no supported isolated-path attribute; prefer active/public areas is available.
- [x] Add “avoid stairs”.
- [x] Add “avoid steep slopes”.
- [x] Add “prefer ramps/elevators”.
- [x] Add “prefer covered/shaded paths”.
- [x] Add “prefer active/public areas”.
- [x] Add maximum acceptable detour.
- [ ] Add optional age bracket only if retained. Omitted: direct needs suffice; no demographic information is collected.
- [x] Do not add full IC number.
- [x] Persist preferences locally.
- [x] Add editable Profile preferences screen.
- [x] Feed applicable preferences into routing request.
- [ ] Add Custom profile if P0 routing remains stable. Deferred: preserve three public profile contracts; supported preferences already apply across them.

Verified Phase 6 (2026-10-16): three-step onboarding, back/skip/reset, centralized needs model, AsyncStorage completion/settings and restart persistence, editable Profile, mapped supported preferences and preference-aware cache. No IC/age data; covered/shaded and ramps/elevators labelled inactive. Custom/isolated/age conditional items intentionally unchecked. Required acceptance is complete. Final lint/types/65 mobile tests; API Ruff/119 tests; Android first-run/restart/real routing and 320dp/200% QA. See docs/demo/phase678/results.md.

## Phase 7 — Community route sharing

- [x] Design Community feed.
- [x] Build community route card.
- [x] Build route detail.
- [x] Build Share Route form.
- [x] Add route title.
- [x] Add purpose tags.
- [x] Add notes.
- [x] Add accessibility tags.
- [x] Add route warnings.
- [x] Add last-walked date.
- [x] Add optional photo picker.
- [x] Show verification state.
- [ ] Add save/bookmark action if time permits. Deferred optional action; no fake saved state.
- [ ] Add confirm action if time permits. Deferred optional action; no fake confirmation counts or promotion.
- [x] Add report-content action.

Verified Phase 7 (2026-10-16): seeded/local feed/cards/detail/map, structured title/purpose/notes/accessibility/warnings/date/optional-photo sharing, validation, success/retry, new route appears Community submitted. Local repository list/get/create and serialized durable storage; never auto-verified. Local report-content flag is implemented with explicit no-moderation disclosure. Optional bookmark/confirm left unchecked. Required acceptance complete; final lint/types/65 tests and native normal/stress flow pass.

## Phase 8 — Barrier reporting

- [x] Build Report Barrier entry point from active route/map.
- [x] Add category: blocked/broken walkway.
- [x] Add category: lift unavailable.
- [x] Add category: missing/blocked ramp.
- [x] Add category: construction.
- [x] Add category: poor lighting.
- [x] Add category: flooded path.
- [x] Add category: unsafe crossing.
- [x] Add category: incorrect map connection.
- [x] Capture map location/segment.
- [x] Add optional photo.
- [x] Add description.
- [x] Add temporary/permanent selector.
- [x] Add timestamp.
- [x] Show newly submitted report as community submitted, never verified.
- [x] Add success state.
- [x] Add error/retry state.

Verified Phase 8 (2026-10-16): Planner entry, all eight categories, current-route waypoint or explicit demo fallback, required details, optional reused photo, duration state/timestamp/24-hour temporary reconfirmation, review/success/failure/retry, repository and inspectable local report list. All creates community_submitted, no engine mutation. Required acceptance complete; final lint/types/65 mobile tests, Ruff/119 backend tests, Android happy flow and 320dp/200% long-description submission pass. Clean npm ci and final Android export pass. Phase 9 and final animation remain untouched.

## Phase 9 — Supabase

### Schema

- [x] Add profiles migration.
- [x] Add route posts migration.
- [x] Add route image schema: one photo_path column, matching the single-photo form; no join table needed.
- [x] Add barrier reports migration.
- [x] Resolve confirmations schema: not used; Phase 7 confirmation remains deferred, so no table/count added.
- [x] Add verification status fields.
- [x] Add freshness/expiry fields.
- [x] Add indexes required by primary queries.

### Security

- [x] Enable RLS for user/community tables.
- [x] User can update/delete own profile.
- [x] User can update/delete own route posts according to product rules.
- [x] User can update/delete own barrier reports according to product rules.
- [x] Public/community reads obey intended visibility.
- [x] Service-role/secret key absent from mobile; no privileged key required.
- [x] Validate image MIME type/size rules.
- [x] Add basic abuse/rate-limit plan for future production use.

### Client integration

- [x] Configure Supabase client.
- [x] Add auth flow or hackathon-safe guest/demo fallback.
- [x] Persist preferences.
- [x] Persist route posts.
- [x] Persist barrier reports.
- [x] Upload route/report photos.
- [x] Load Community feed from Supabase.
- [x] Verify persistence after app restart.

Verified 2026-10-17: fresh free Jom! project in Singapore, anonymous auth enabled with user confirmation, real public configuration only in ignored mobile .env.local. Two migrations deployed; private profiles, public published routes/reports, server-owned verification/expiry, bounded snapshots, indexes and public-read/owner-write Storage. Existing repository contracts preserved; explicit local fallback remains. Live two-user public-key tests pass ownership CRUD, cross-user/spoofed/signed-out write rejection, verified/confirmed escalation rejection, image uploads/public reads/overwrite protection and session restore. Native guest → onboarding → preferences → cold restart, photo route → restart, active-route photo report → restart pass. Final npm ci preserves all baseline entries plus ten additions; Expo lint/types/79 mobile tests, Ruff/119 API tests and Android production export pass. README/PLAN and docs/demo/phase9/results.md contain setup/evidence/limits. Docker/local reset and generated DB types not claimed; existing Expo/Router patch advisories retained. Phase 9 complete; Phase 10+ unchanged. No commit/push.

## Phase 10 — Confidence, freshness, and verification UX

- [x] Define confidence levels.
- [x] Define verification labels.
- [x] Define stale-data threshold for demo.
- [x] Display `Community submitted`.
- [x] Display `Confirmed by multiple users` when supported.
- [x] Display `Township/venue verified` when supported.
- [x] Display `Accessibility unknown`.
- [x] Display last-verified time.
- [x] Add stale-data warning.
- [x] Add temporary report expiry behavior.
- [x] Ensure confidence is not presented as probability of personal safety.

Verified 2026-10-18: lint/types/85 mobile tests; Ruff/121 API tests. Android details, community feed and existing temporary report inspected. Expiry boundary and mounted refresh tested with fake time. Unknown dates/evidence remain explicit. Existing authorized verification states and RLS preserved; no migration. Physical phone/iOS/spoken screen reader not tested. Evidence: docs/demo/phase10.

## Phase 11 — Motion and interaction polish

### Skill workflow

- [x] Read `animation-vocabulary/SKILL.md`.
- [x] Read `animate-expo/SKILL.md`.
- [x] Read `animate/SKILL.md`.
- [x] Run `find-animation-opportunities`.
- [x] Implement only high-value animation opportunities.
- [x] Run `improve-animations`.
- [x] Run `review-animations`.

### Candidate interactions

- [x] Profile-switch transition.
- [x] Route-line emphasis transition.
- [x] Route comparison sheet transition.
- [x] Route card selection feedback.
- [x] Barrier report success feedback.
- [x] Community publication feedback; optional bookmark/confirmation remain unimplemented.
- [x] Haptics only where useful.
- [x] Respect Reduce Motion.
- [x] Verify motion does not block input.

Verified 2026-10-18: lint/types/88 mobile tests, Ruff/121 API tests. Android profiles, barrier steps and Remove animations onboarding pass. Review: docs/demo/phase11/motion-review.md. Explicit comparison expand/collapse retained; no custom drag. Physical haptic feel, iOS and release performance not claimed.

## Phase 12 — Accessibility and UI stress testing

- [x] Apply `break-ui` again to all core screens.
- [x] Screen reader labels on profile controls.
- [x] Screen reader labels on route cards.
- [x] Screen reader labels on map-related actions.
- [x] Large text does not clip critical content.
- [x] 44×44 minimum touch targets.
- [x] Non-colour route/verification indicators.
- [x] Keyboard does not cover fields/actions.
- [x] Small-screen layout works.
- [x] Long destination names work.
- [x] Long community route notes work.
- [x] Offline/API-down state works.
- [x] Permission-denied state works.
- [x] Unknown-data state works.
- [x] No-route state works.
- [x] Empty Community state works.
- [x] Photo upload failure works.

Verified 2026-10-18: final npm run check passes lint/types/97 tests across 15 suites; Ruff/121 API tests; Android production export; real two-user public-key Supabase security/expiry/Storage/session checks. Native 320dp/200% onboarding, Planner long/unknown, Community/detail/empty, share failure, Profile and 2000-character temporary-report keyboard/review/success inspected. All scoped P0/significant P1 findings fixed. QA report docs/demo/ui-accessibility-qa.md; PNG/XML in docs/demo/phase12. Labels/states are source/component/native-tree verified; spoken TalkBack/VoiceOver, physical Android, iOS and release performance remain untested. Original emulator settings restored. No Phase 13/14 or publication work.

## Phase 13 — Demo scenarios and hardening

### Scenario A — Night route

- [ ] Seed deterministic start/destination.
- [ ] Fastest route is shorter.
- [ ] Safer-at-Night route is longer but better lit/public.
- [ ] Explanation displays the actual trade-off.
- [ ] Confidence/freshness is visible.

### Scenario B — Step-free route

- [ ] Fastest path contains stairs.
- [ ] Step-Free excludes stairs.
- [ ] Accessible alternative is visibly different.
- [ ] Explain why the alternative was chosen.

### Scenario C — Community update

- [ ] Create/share a community route.
- [ ] Submit a temporary barrier report.
- [ ] New submission is visibly unverified.
- [ ] Community screen reflects the change.

### Recovery

- [ ] Create deterministic demo seed/reset command.
- [ ] Document demo reset procedure.
- [ ] Add API-offline demo fallback only if needed.
- [ ] Clearly label fallback data as demo/simulated.

## Phase 14 — Final quality gates

- [ ] Mobile lint passes.
- [ ] Mobile typecheck passes.
- [ ] Mobile tests pass.
- [ ] API Ruff passes.
- [ ] API Pytest passes.
- [ ] API health endpoint passes.
- [ ] Route API contract test passes.
- [ ] Fresh-start README instructions verified by another team member.
- [ ] No secrets committed.
- [ ] No full IC field anywhere.
- [ ] No UI text guarantees route safety.
- [ ] No missing accessibility field is shown as accessible.
- [ ] No community submission is auto-labelled verified.
- [ ] Known limitations documented.
- [ ] Demo screenshots captured.
- [ ] Five-minute demo rehearsed.
- [ ] `PLAN.md` Outcomes & Retrospective updated.
- [ ] `TODOLIST.md` reflects actual final scope.

## Stretch goals — only after the MVP is stable

- [ ] Age-Friendly route profile.
- [ ] Covered/shaded routing using verified data.
- [ ] Rain/heat-aware route preferences.
- [ ] Indoor waypoint navigation.
- [ ] Live elevator status integration.
- [ ] Operator dashboard.
- [ ] Aggregated infrastructure issue heatmap.
- [ ] Contributor reputation.
- [ ] AI-assisted photo tagging with human verification.
- [ ] Haptic turn-by-turn guidance.
- [ ] Screen-reader-first navigation mode.
- [ ] Multilingual UI.

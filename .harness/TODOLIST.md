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

- [ ] Define `RouteProfile`.
- [ ] Define `RoutePreferences`.
- [ ] Define `RoutePoint`.
- [ ] Define `RouteRequest`.
- [ ] Define `RouteReason`.
- [ ] Define `RouteOption`.
- [ ] Define `RouteResponse`.
- [ ] Implement `POST /v1/routes`.
- [ ] Validate profile values.
- [ ] Validate origin/destination.
- [ ] Add node/coordinate snapping strategy.
- [ ] Return 1–3 route options.
- [ ] Return geometry.
- [ ] Return ETA and distance.
- [ ] Return reasons/warnings.
- [ ] Return confidence and verification summary.
- [ ] Add clean no-route response.
- [ ] Add request/response API tests.
- [ ] Document sample route request in README.

## Phase 5 — Mobile/API integration

- [ ] Create typed routing API service.
- [ ] Add environment-based API base URL.
- [ ] Add planner state/hook/store.
- [ ] Connect origin/destination to request model.
- [ ] Connect profile selector to API request.
- [ ] Render API route geometry.
- [ ] Render route options from API.
- [ ] Select a route from the comparison sheet.
- [ ] Highlight selected route on the map.
- [ ] Show API reasons.
- [ ] Show warnings.
- [ ] Show confidence.
- [ ] Show last-verified state when present.
- [ ] Implement loading state.
- [ ] Implement timeout state.
- [ ] Implement API error state.
- [ ] Implement no-route state.
- [ ] Implement retry.
- [ ] Implement location-permission-denied state.
- [ ] Ensure route scoring logic exists only on server.

### Phase 5 acceptance

- [ ] Same trip returns visibly different route for Fastest vs Safer at Night.
- [ ] Same trip excludes stairs in Step-Free.
- [ ] UI explanation matches API response.
- [ ] No manual code/data edit is needed during demo.

## Phase 6 — Onboarding and preferences

- [ ] Design onboarding with explicit user needs.
- [ ] Add “prefer well-lit paths”.
- [ ] Add “avoid isolated routes” if supported by data.
- [ ] Add “avoid stairs”.
- [ ] Add “avoid steep slopes”.
- [ ] Add “prefer ramps/elevators”.
- [ ] Add “prefer covered/shaded paths”.
- [ ] Add “prefer active/public areas”.
- [ ] Add maximum acceptable detour.
- [ ] Add optional age bracket only if retained.
- [ ] Do not add full IC number.
- [ ] Persist preferences locally.
- [ ] Add editable Profile preferences screen.
- [ ] Feed applicable preferences into routing request.
- [ ] Add Custom profile if P0 routing remains stable.

## Phase 7 — Community route sharing

- [ ] Design Community feed.
- [ ] Build community route card.
- [ ] Build route detail.
- [ ] Build Share Route form.
- [ ] Add route title.
- [ ] Add purpose tags.
- [ ] Add notes.
- [ ] Add accessibility tags.
- [ ] Add route warnings.
- [ ] Add last-walked date.
- [ ] Add optional photo picker.
- [ ] Show verification state.
- [ ] Add save/bookmark action if time permits.
- [ ] Add confirm action if time permits.
- [ ] Add report-content action.

## Phase 8 — Barrier reporting

- [ ] Build Report Barrier entry point from active route/map.
- [ ] Add category: blocked/broken walkway.
- [ ] Add category: lift unavailable.
- [ ] Add category: missing/blocked ramp.
- [ ] Add category: construction.
- [ ] Add category: poor lighting.
- [ ] Add category: flooded path.
- [ ] Add category: unsafe crossing.
- [ ] Add category: incorrect map connection.
- [ ] Capture map location/segment.
- [ ] Add optional photo.
- [ ] Add description.
- [ ] Add temporary/permanent selector.
- [ ] Add timestamp.
- [ ] Show newly submitted report as community submitted, never verified.
- [ ] Add success state.
- [ ] Add error/retry state.

## Phase 9 — Supabase

### Schema

- [ ] Add profiles migration.
- [ ] Add route posts migration.
- [ ] Add route post images migration if needed.
- [ ] Add barrier reports migration.
- [ ] Add route confirmations migration if needed.
- [ ] Add verification status fields.
- [ ] Add freshness/expiry fields.
- [ ] Add indexes required by primary queries.

### Security

- [ ] Enable RLS for user/community tables.
- [ ] User can update/delete own profile.
- [ ] User can update/delete own route posts according to product rules.
- [ ] User can update/delete own barrier reports according to product rules.
- [ ] Public/community reads obey intended visibility.
- [ ] Service-role key is server-only and absent from mobile bundle.
- [ ] Validate image MIME type/size rules.
- [ ] Add basic abuse/rate-limit plan for future production use.

### Client integration

- [ ] Configure Supabase client.
- [ ] Add auth flow or hackathon-safe guest/demo fallback.
- [ ] Persist preferences.
- [ ] Persist route posts.
- [ ] Persist barrier reports.
- [ ] Upload route/report photos.
- [ ] Load Community feed from Supabase.
- [ ] Verify persistence after app restart.

## Phase 10 — Confidence, freshness, and verification UX

- [ ] Define confidence levels.
- [ ] Define verification labels.
- [ ] Define stale-data threshold for demo.
- [ ] Display `Community submitted`.
- [ ] Display `Confirmed by multiple users` when supported.
- [ ] Display `Township/venue verified` when supported.
- [ ] Display `Accessibility unknown`.
- [ ] Display last-verified time.
- [ ] Add stale-data warning.
- [ ] Add temporary report expiry behavior.
- [ ] Ensure confidence is not presented as probability of personal safety.

## Phase 11 — Motion and interaction polish

### Skill workflow

- [ ] Read `animation-vocabulary/SKILL.md`.
- [ ] Read `animate-expo/SKILL.md`.
- [ ] Read `animate/SKILL.md`.
- [ ] Run `find-animation-opportunities`.
- [ ] Implement only high-value animation opportunities.
- [ ] Run `improve-animations`.
- [ ] Run `review-animations`.

### Candidate interactions

- [ ] Profile-switch transition.
- [ ] Route-line emphasis transition.
- [ ] Route comparison sheet transition.
- [ ] Route card selection feedback.
- [ ] Barrier report success feedback.
- [ ] Community post save/confirm feedback.
- [ ] Haptics only where useful.
- [ ] Respect Reduce Motion.
- [ ] Verify motion does not block input.

## Phase 12 — Accessibility and UI stress testing

- [ ] Apply `break-ui` again to all core screens.
- [ ] Screen reader labels on profile controls.
- [ ] Screen reader labels on route cards.
- [ ] Screen reader labels on map-related actions.
- [ ] Large text does not clip critical content.
- [ ] 44×44 minimum touch targets.
- [ ] Non-colour route/verification indicators.
- [ ] Keyboard does not cover fields/actions.
- [ ] Small-screen layout works.
- [ ] Long destination names work.
- [ ] Long community route notes work.
- [ ] Offline/API-down state works.
- [ ] Permission-denied state works.
- [ ] Unknown-data state works.
- [ ] No-route state works.
- [ ] Empty Community state works.
- [ ] Photo upload failure works.

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

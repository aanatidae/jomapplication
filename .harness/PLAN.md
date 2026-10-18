# Build the Jom! smart pedestrian route-planning MVP

This `PLAN.md` is the living ExecPlan for the Jom! application. It must be kept in sync with implementation. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` are mandatory living sections. A future contributor should be able to resume the project using only the repository, this file, `AGENTS.md`, and `TODOLIST.md`.

## Purpose / Big Picture

Jom! should demonstrate that “best walking route” depends on the person and the situation, not only on distance. After implementation, a user can choose an origin and destination, compare multiple walking routes, and select profiles such as Fastest, Safer at Night, or Step-Free. The app explains the trade-off in plain language, for example: a route is three minutes longer but better lit and step-free.

The hackathon MVP is intentionally narrow. It must demonstrate a credible pilot in one contained area instead of pretending to have complete city-wide safety or accessibility data. It must also include a small community layer for sharing routes and reporting barriers.

The working demonstration should make this sentence visibly true:

> Same origin. Same destination. Different need. Different best route.

The product concept is validated by the team's 168-response survey. The survey found strong interest in route factors beyond time, including sidewalks, safe crossings, lighting, covered/shaded paths, current closures, and accessibility information. The app should preserve this evidence-driven focus.

## Progress

- [x] (2026-10-18) User explicitly authorized committing and pushing the verified Phases 10–12 work with “commit and push”. Confirmed destination https://github.com/aanatidae/jomapplication, branch main, author/committer Saw Jun Yang (aanatidae). This consent covers this publication only; future pushes require consent.

- [x] (2026-10-18, Phase 12) break-ui and React component review applied across core flows. Fixed read-retry feedback, validation hints, expanded-state semantics, duplicate auth/photo/content actions and all-surface map contrast. Final npm run check passes lint/types/97 tests (15 suites); Ruff/121 API tests pass. Real two-user Supabase ownership/verification/Storage/session/24h-expiry checks pass and remove disposable rows/images. Native 320dp/200% long-place/unknown Planner, long onboarding/Profile, Community/detail/full prose/empty, share failure/retry, keyboard-open 2000-char report through review/success inspected. Android export passes. QA report: docs/demo/ui-accessibility-qa.md. No known scoped P0/significant P1 remains; physical devices, iOS, spoken readers and release performance remain unverified. Phase 13/14 untouched; no commit/push.

- [x] (2026-10-18, Phase 11) Required skills/recipes/audit standards applied. UI-runtime press/selection, occasional form-step motion, persistence-confirmed haptics, synchronous submission guards and live Reduce Motion implemented. Lint/types/88 tests and Ruff/121 tests pass. Android profiles, barrier steps and OS-disabled-motion onboarding verified; crash buffer empty. Clean npm ci preserves baseline plus one haptics record. Review: docs/demo/phase11/motion-review.md. Physical release feel/FPS/iOS not tested.

- [x] (2026-10-18, Phase 10) Clean baseline; original lint/types/79 mobile tests and Ruff/119 API tests passed. Extended server-owned quality metadata without changing scoring; reused protected verification and expiry. Final Phase 10 lint/types/85 tests and Ruff/121 tests pass. Android source-details and Community/report-status screens inspected; docs/demo/phase10 contains PNG/XML. Verification dates remain unknown. No migrations/security changes.

- [x] (2026-10-17) User explicitly authorized committing and pushing the verified Phase 9 work with “commit and push”. Confirmed destination `https://github.com/aanatidae/jomapplication`, branch `main`, attribution Saw Jun Yang (aanatidae). This authorization covers this publication only; future pushes require consent. Local Supabase credentials remain ignored and untracked.

- [x] (2026-10-17, Phase 9 complete) Read full harness/mobile AGENTS, inspected clean Git at 11f09b1 and revalidated stable Phases 6–8 before edits (65 mobile tests, lint/types, Ruff/119 API tests). Fresh free Jom! project in Singapore, user-handled password creation and confirmed anonymous auth. Actual public config only in ignored mobile .env.local. Two deployed migrations, RLS flags/history inspected and three reproducible seeds. Supabase implementations preserve all repository contracts; explicit local mode retained. Real two-user public-key tests pass ownership, verification escalation, Storage and session restore and clean test content. Native onboarding/preferences cold restart, photo route cold restart and active-route photo report cold restart pass. Final original Expo lint/types/79 tests, Ruff/119 API tests, clean npm ci and Android Hermes export pass. Every baseline lock entry preserved plus ten Phase 9 additions. README/setup/evidence/harness updated; no Phase 10+, commit or push. Evidence: docs/demo/phase9/results.md.

- [x] (2026-10-16) User explicitly authorized committing and pushing the verified Phases 6–8 work with “commit and push”. Confirmed destination `https://github.com/aanatidae/jomapplication`, branch `main`, author/committer Saw Jun Yang (aanatidae). Authorization covers this publication only; future pushes require consent.

- [x] (2026-10-16) Phase 8 complete and Phases 6–8 final verification complete: Planner reporting entry, eight stable categories, labelled schematic route-point association/fallback, four-step form/review, optional shared photo picker, temporary/permanent/unknown, timestamp, forced community_submitted, 24-hour configurable temporary reconfirmation, durable local repository and inspectable report list. Android happy flow and 320dp/200% stress submissions pass. Final clean npm ci --no-audit --prefer-offline succeeds (1065 packages), npm run check passes lint/types/65 tests across 9 suites, API Ruff clean/119 tests, live health 200, final Android Hermes production export succeeds. Evidence: docs/demo/phase678/results.md and PNG/XML captures. No Supabase, Phase 9 work, final animation work, commit or push.
- [x] (2026-10-16) break-ui applied to new onboarding/community/detail/share/report screens with isolated development fixtures. Fixed expanding multiline fields that trapped scroll, oversized duplicated-title actions, long review descriptions, unbounded initial feed rendering, first-run/read-error safe areas and require cycle. Native small-screen/200% text, many selections/tags, long descriptions, no GPS/photo, keyboard and selected photo paths checked; failure/retry, permission denial and data rules also tested. Emulator settings restored. Physical phone/iOS/spoken TalkBack remain unverified.

- [x] (2026-10-16) Phase 7 verified before Phase 8: Community feed, reusable cards, detail/map, structured sharing, tags/warnings/date, optional local photo control and serial local repository. Lint/types/49 mobile tests pass; 119 API tests + Ruff pass. Android seeded feed/detail → keyboard-open form → local submit → success → feed with Community submitted verified; evidence docs/demo/phase678/. Supabase/moderation/confirmation counters untouched.

- [x] (2026-10-16) Phase 6 implemented and verified before Phase 7: three-step needs-based onboarding, shared Profile controls, versioned AsyncStorage preferences, restart gate, supported preference mapping and request-cache invalidation. Mobile lint/types and 41 tests pass; API Ruff and 117 tests pass. Android onboarding selected well-lit + avoid stairs; Profile retained both; planner returned 10-minute no-stairs option. Restart verification captured in docs/demo/phase678/. Custom deferred; no identity/IC/age collection.

- [x] (2026-10-16) User explicitly authorized committing and pushing verified Phase 4/5 work with “commit and push”. Confirmed destination `https://github.com/aanatidae/jomapplication`, branch `main`, attribution Saw Jun Yang (aanatidae). This authorization covers the Phase 4/5 publication only; future pushes require consent.

- [x] (2026-10-16) Phase 4 complete before Phase 5 implementation: reused Phase 3 loader/models/engine/config/explanations/confidence; added typed HTTP boundary and POST /v1/routes, deterministic 1–3 options, node validation and sanitized errors. Baseline Git clean; baseline Ruff/92 tests passed. Phase 4 first gate: Ruff + 106 tests passed (14 contract cases); final gate after retryable-search coverage: Ruff + 107 tests (15 contract + 92 preserved). GET /health verified over live HTTP. README contains request/response and native-development CORS decision.
- [x] (2026-10-16) Phase 5 complete for the simulated pilot: typed routingApi client, environment URL, 10-second timeout, runtime response checks, cancellation, feature hook with per-trip/profile cache and stale-response suppression, real pilot place IDs, independent profile/alternative selection, backend reasons/warnings/confidence/freshness and schematic geometry. Final npm run check passes lint/types/35 tests. Native Android Studio Expo Go verified same trip Fastest 8min/600m, Night 10min/720m, Step-Free 12min/830m with distinct preferred lines and HTTP calls; no scenario code/data edits. Alternative selection, real no-route, network failure/retry, delayed loading/timeout/retry and 320dp/200% text verified. Evidence: docs/demo/phase45/results.md, HTTP JSON and PNG/XML pairs. Physical phone/iOS/spoken TalkBack untested; geographic provider issue remains Phase 0. No dependencies, unrelated work, later-phase implementation, commit or push changed.

- [x] (2026-10-16) User explicitly authorized committing and pushing verified Phase 3 work with “commit and push”. Confirmed destination `https://github.com/aanatidae/jomapplication`, branch `main`, attribution Saw Jun Yang (aanatidae). This authorization covers the Phase 3 publication only; future pushes require consent.

- [x] (2026-10-16) Phase 3 complete: strict simulated pilot loader, normalized profile scoring, algorithmic candidates, hard Step-Free constraints, deterministic ranking, truthful explanations and isolated data confidence. Before edits read the full harness and inspected API/Git; clean at Phase 2 commit `20d67b9`. Revalidated baseline mobile lint/types/14 tests, API Ruff/3 tests. Final Ruff and 92 API tests pass (89 new routing tests + 3 preserved); npm run check passes lint/types/14 mobile tests. Inspected offline CLI results A=8min/600m, B=10min/720m, C=12min/830m. Documentation/output: `docs/demo/route-fixture-notes.md`, `docs/demo/phase3-routing-results.txt`. No mobile/API integration, dependency changes, commit or push. Backend-only scope requires no new UI/motion skill.

- [x] (2026-10-16) User explicitly authorized committing and pushing the verified Phase 2 work with “commit and push”. Destination confirmed as `https://github.com/aanatidae/jomapplication`, current branch `main`, attribution Saw Jun Yang (aanatidae). Authorization covers this Phase 2 publication only; future pushes still require consent.

- [x] (2026-10-16) Phase 2 complete within the mock-planner scope. Re-read harness and seven required skills before edits; applied break-ui after main implementation. Clean Git baseline; revalidated Phase 1 lint/types, 3 navigation tests, 3 API tests and Ruff. Central native tokens/primitives, local place selection, three profiles, route cards/geometry, quality labels and degraded controls implemented. Final `npm run check` passes (lint, strict types, 14 tests); native Android manual/stress QA passes, independent finish review SHIP after permission recovery fix. Evidence: `docs/demo/phase2/results.md` and native PNG/XML pairs. No commit or push performed.

- [x] (2026-10-15) User explicitly requested commit and push of the current verified work. Confirmed destination repository is empty; initialized root Git on main and preserved the template's nested Git metadata under ignored `.local/git-metadata/mobile.git`. Configured local attribution to authenticated human maintainer Saw Jun Yang (aanatidae), with GitHub account-linked noreply email. No assistant author/co-author metadata is added. This authorization covers the current publication only.

- [x] (2026-10-15) Phase 1 complete: npm workspace and single root lockfile; Planner/Community/Profile shell; environment template and ignore coverage; all quality gates and emulator navigation verified. User explicitly scoped this work to Phase 1; unresolved Phase 0 map rendering remains separately tracked.

- [x] (2026-10-15) Recorded the user-designated GitHub push destination and explicit approval requirement in all three harness files. No push performed.

- [x] (2026-10-15) Product scope extracted from the Jom! project documentation and validation survey.
- [x] (2026-10-15) Codex handoff documents created: `AGENTS.md`, `PLAN.md`, and `TODOLIST.md`.
- [x] (2026-10-15) Repository audited: only three .harness files initially, no root Git repository, no existing stack or user implementation.
- [x] (2026-10-15) All seven required design/mobile SKILL.md files read; production design deferred.
- [ ] Mapping and Expo compatibility spike completed and decision recorded.
- [x] (2026-10-15) Repository scaffold and local development environment working (Phase 1).
- [x] (2026-10-16) Design system and mobile navigation shell implemented (Phase 2).
- [x] (2026-10-16) Pilot pedestrian graph and offline routing engine implemented (Phase 3).
- [x] (2026-10-16) Fastest profile verified with deterministic tests.
- [x] (2026-10-16) Safer-at-Night profile verified with deterministic tests.
- [x] (2026-10-16) Step-Free profile verified with deterministic tests and hard exclusions.
- [x] (2026-10-16) Mobile route-planning flow integrated with the routing API (Phase 5).
- [x] (2026-10-16) Explainable route comparison UI implemented with deterministic demo fixtures (Phase 2); API integration remains later work.
- [x] (2026-10-16) Onboarding and preference management implemented and verified (Phase 6).
- [x] (2026-10-16) Community route sharing implemented and verified locally (Phase 7).
- [x] (2026-10-16) Barrier reporting implemented and verified locally (Phase 8).
- [x] (2026-10-17) Supabase persistence, authentication, storage, and RLS implemented and verified (Phase 9).
- [x] Accessibility, edge cases, and UI stress tests completed within the documented Android/test scope; physical/iOS/spoken-reader acceptance remains unverified.
- [x] Animation pass completed and reviewed with installed animation skills; physical release feel/performance unverified.
- [ ] End-to-end demo scenario rehearsed successfully.
- [ ] Build, test, lint, documentation, and submission hardening completed.

## Surprises & Discoveries

- (2026-10-18, Phase 12) Alternate line opacity adequate on base map was inadequate over park/block/water. Reused muted #52635D at .9 opacity; minimum 3.73:1 across every schematic surface, guarded by a contrast regression. Retry initially kept old error and allowed repeated reads; loading now replaces it immediately. Expanded descriptions lacked expanded-state semantics; field errors lacked input hints. Native automation must serialize uiautomator and distinguish editor internal scrolling from outer-form scrolling. Gboard displayed its own font-size tutorial; barrier-keyboard capture proves normal editor/keyboard visibility. Original 1080x2400/420dpi/font_scale 1.0 restored, Remove animations override removed. Final crash buffer retained UIAutomation registration errors from earlier overlapping helper calls; no Expo app crash stack was found. Final native operations serialized.

- (2026-10-18, Phase 11) Reanimated native transitionTimingFunction requires cubicBezier(), unlike skill CSS-string example; native exception corrected. Expo install attempted relocation; stopped task Metro/install, preserved baseline plus one Expo-selected haptics lock record, clean npm ci succeeded (1076 packages). Worklets mock must precede Reanimated; Router overrides main mock, so shared vendor mock is extended. .75 alternate-line opacity failed contrast (2.57:1); .9 yields 3.24:1.

- (2026-10-18) Edge last_updated_at is not last_verified_at; no distinct verified date exists. Community confirmations have no counter/evidence; confirmed state alone cannot justify multiple-user wording. Mounted report summaries previously froze their clock. Expo/Jest and TestClient sandbox stalls reproduce; host gates pass. Impeccable context launcher fails cache_directory_failed; existing PRODUCT/DESIGN/craft-floor/harden read directly. ui-skills registry selected Callstack React Native guidance on host.

- (2026-10-17, Phase 9) No Supabase configuration/migrations or CLI/Docker were initially present. CLI init now exists, but dashboard sign-in does not provide CLI management/type-generation credentials. Bootstrapped the confirmed empty hosted schema using versioned SQL through the dashboard and recorded CLI-compatible version/name history. No database password/service-role key was retrieved. Supabase SQL editor's Monaco textarea fill can append rather than replace the full document: select all, Backspace, fill, select/copy and compare to the file before execution. Failed transactions were not counted as applied; final inspection shows both versions, RLS=true and three seeds.
- (2026-10-17, Phase 9) Expo install hit EBUSY, then npm relocated packages and picked unrelated patch updates. Rebuilt the final lock from baseline entries plus only ten required Phase 9 entries and verified npm ci (1075 packages), tests/native/export. All original package metadata, versions and locations are preserved. Temporary root React-type and direct-ESLint workarounds were removed; original Expo lint works cleanly again. Final direct additions are Supabase 2.118, URL polyfill 4.0 and Expo file reader 57.0.7. Compatibility check still recommends existing Expo 57.0.29 → ~57.0.30 and Router 57.0.27 → ~57.0.28; these unrelated patch upgrades remain deferred. Supabase 2.118 coordinates refresh without processLock, so removed that deprecated option after a native warning. Sandbox limitations remain; final host suites pass.

- (2026-10-16, final native review) New sharing/reporting actions initially displaced the three route-priority controls below the normal initial viewport. Reordered priorities directly after the map, before secondary actions; native final-planner-priority evidence, lint/types/65 tests and final Android export reverified.

- (2026-10-16, final Phase 6–8) Final lockfile preserves all baseline package versions/placement and adds only five mobile entries: AsyncStorage, merge-options/is-plain-obj, ImagePicker and ImageLoader. Temporary root React-type workaround and incidental installer relocations/upgrades were removed; original nested peers resolve correctly. Fresh npm ci, checks and Android export prove this final arrangement. Existing npm audit remediation remains separate; no audit-force/SDK upgrade.
- (2026-10-16, break-ui) At 320dp/font_scale 2, a 2,000-character multiline field expanded enough to absorb page scrolling. Cap editable viewport at four standard control heights while preserving internal scroll. Long review/detail prose now has a four-line expandable preview; full content remains available. Card action is View route with title accessibility hint, and feeds initially render 20 entries with Show more. Native worst-case sharing and barrier submissions both reached success. Initial read failures now share onboarding's safe-area protection; retry preserves stored preferences.

- (2026-10-16, Phase 7) Expo install changed nested npm placement mid-process and its plugin autoconfiguration failed after successful package install. Added plugin configuration explicitly; preserved baseline lock entries plus additions, then npm ci restored repeatable resolution. Do not run installation while Metro is rendering a bundle. No SDK upgrade attempted. Native QA automation must target EditText rather than a matching visible field label and serialize UI-tree requests.

- (2026-10-16, Phase 6) Phase 4 reserved preferences rejected nonempty requests, so added server-owned preference constraints/costs without changing default profile behavior. Avoid-stairs selects the 10-minute route (not full Step-Free's 12-minute route). AsyncStorage install hoisted React Native while React types stayed nested, breaking all baseline JSX types; root shared @types/react resolves the peer boundary. Native QA found safe-area and require-cycle issues; fixed with safe wrapper and separate context module.

- (2026-10-16, Phase 4/5) Phase 3 geometry is local metres, not geographic coordinates. Native provider tiles remain unresolved, but Phase 2 already adopted a labelled native schematic renderer; projecting returned local geometry preserves that decision without inventing lat/lng or geocoding. Community Mall uses the actual mall_entrance node; default demonstration is transit_stop → residential_block.
- (2026-10-16, Phase 4/5) Existing domain reasons/warnings/verification summaries are strings and confidence is a typed record. Public API reuses these conventions rather than duplicating explanation models or scoring. Preferences are unsupported by the engine: reserved fields accept only null and non-empty values return 422, avoiding silently ignored route needs.
- (2026-10-16, Phase 5) Native failure QA exposed Expo LogBox overlaying Retry when expected network/no-route events used console.warn. Changed expected diagnostics to console.info; clients only see actionable recovery copy. Fixed progressbar accessibility, singular route-option copy, and hid markers along with unavailable geometry. Added numbered route labels so alternatives have identities beyond colour; removed the mock 8-minute baseline calculation from shared cards.
- (2026-10-16, Phase 4/5) Full TestClient/Jest suites used the established host workaround; sandbox baseline TestClient stalled. Impeccable context launcher again failed cache_directory_failed, so read PRODUCT/DESIGN and craft-floor/harden/operate directly. ui-skills CLI selected Callstack React Native guidance. No added motion, library or dependency. The existing Metro on 8081 was preserved; isolated test Metro used localhost:8082 and ADB reverse. Slow HTTP fixture on 8001 was stopped and API reverse restored after timeout QA.

- (2026-10-16, Phase 3) Final gates: Ruff clean; Pytest 92/92, including all health/spike regressions; mobile lint/strict TypeScript/14 tests pass. Preserved httpx/Starlette TestClient deprecation warning is non-fatal. Routing tests run offline in sandbox; full legacy TestClient/Jest gates use the documented host workaround. No application foundation regression found. New files are limited to routing domain, pilot JSON, routing tests and demo docs; only harness files modified among existing tracked files.

- (2026-10-16, Phase 3) Existing API has only `main.py` health/spike logic and three tests; no reusable production route models or verified pilot dataset. Preserved all existing endpoints. NetworkX 3.6.1 and Pydantic 2.14.1 already installed; no new dependency needed. Added independent internal models, not Phase 4 HTTP contracts.
- (2026-10-16, Phase 3) Validation probe found strict Pydantic Literal[1] accepts JSON true because Python bool equals int. Added explicit integer schema-version validation and regression tests. Missing/null boolean attributes stay None. Entrance/crossing context must be derived from node kinds; Step-Free now rejects unknown entrances and crossings without established ramp/curb-cut transitions.
- (2026-10-16, Phase 3) Per-edge unscaled environmental penalties would introduce a hop-count bias. Instead integrate bounded penalties over time/600 exposure; splitting a uniformly attributed segment preserves pre-quantization cost. Tie tests explicitly assert equal costs and examine candidates beyond requested K. Small integer-cost rounding is documented; candidate budget exhaustion is a separate domain error.

- (2026-10-16) Final Phase 2 evidence: Android Studio AVD `Medium_Phone_API_37.0`, Expo Go 57, ADB localhost reverse. Exercised profiles, collapsed/expanded cards, local selection/search and manual error retry; captured all seven degraded states. Tested 320dp × 640dp, 200% OS font scaling, long place/confidence labels, 6–7 reasons, fully overlapping route lines, keyboard-open picker, and 720dp wide layout. Original 1080×2400 / density 420 / font_scale 1.0 restored. Accessibility roles/labels/states verified in tests/native trees; no physical phone, iOS or spoken TalkBack audit is claimed.
- (2026-10-16) Independent native reviewer found “Use manual origin” initially only dismissed the permission message. Fixed it to open the origin picker; cancellation retains the state, selection updates the origin. Added regression assertion and native picker → keyboard filter → selected origin evidence. Reviewer verdict pass: resolved, SHIP for Phase 2. Earlier keyboard captures contained Gboard's font-update banner; `keyboard-filter-final.png` is unobscured.
- (2026-10-16) Contrast verification strengthened the outline from 1.62:1 to 3.58:1 on white. Muted text is at least 5.43:1 on the used content surfaces; white/teal 6.94:1; warning text on selected 5.96:1. Route lines hidden in loading/empty/data/error states so unavailable results cannot appear selected. Long community fixture freshness explicitly remains unverified.

- (2026-10-16) Baseline Jest transforms fail inside the Windows sandbox with EPERM on its temporary cache; identical host-run tests pass. Impeccable context launcher still fails with `cache_directory_failed`; read harness, existing source, new-work, craft-floor, Android and Operate guidance directly. ui-skills registry lookup initially failed under restricted DNS; host lookup succeeded, selected `callstackincubator/react-native-best-practices` from react-native category. No runtime dependency was added.
- (2026-10-16) Android cold boot produced a transient System UI ANR before Expo loaded. Waited for boot and reopened Expo through localhost ADB reverse. Initial screenshot captured before rendering was invalid; do not treat it as planner evidence.
- (2026-10-16) First 320dp / 200% text inspection exposed map legend/footer overlapping endpoints. Moved labels into normal layout outside the geometry canvas; decorative park label omitted at large text. Text, routes, and endpoints retain separate space. Unknown accessibility takes priority over the long confidence stress fixture; QA controls gated by `__DEV__`.

- Phase 1 verification: npm run check passes lint, strict typecheck and 3 Router navigation tests. API Ruff and 3 Pytest tests pass; HTTP GET /health returns 200 with {"status":"ok"}. Expo Doctor passes 21/21; final Android Hermes export passes. Existing httpx/Starlette test-client deprecation warning remains non-fatal.
- Phase 1 manual QA: Planner -> Community -> Profile -> Planner verified through ADB UI-tree-derived taps. Screenshots/UI trees saved under `docs/demo/phase1/`. At 320dp and font scale 2.0, horizontal labels originally fragmented; responsive navigation now stacks, all screens remain reachable, and original AVD settings were restored. Full production-screen stress tests are deferred with the design system; these shells have no user-data fields, keyboard, API states or community lists yet.
- Phase 1 navigation tests caught Expo Link overriding tab roles and press styles. Direct Expo Router navigation from Pressable preserves accessible tab semantics and minimum target size. React review found no added effects, duplicate state, network calls, UI library, or animation.

- Phase 1: the repository still has no root Git metadata; the template's nested `apps/mobile/.git` contains staged Phase 0 files and no commits. Preserve that state; no Git history, authorship, remotes, commits, or pushes changed in this phase.
- Phase 1: Jest's absolute testMatch glob mishandled the exclamation mark in the Windows project path. Use a relative testRegex instead. SDK 57's Router testing helpers are synchronous; current online examples target SDK 58. Tests use the installed SDK 57 helper signatures and standard Jest assertions.
- Phase 1: root npm workspace installation retains a valid nested dependency layout. Startup resolves Expo from the mobile workspace rather than assuming all dependencies are hoisted. `npm ci` succeeded; npm audit reported 64 findings (15 moderate, 49 high), pending compatible remediation. A separate npm ci --no-audit reinstall also passed; audit evidence is recorded separately in docs/demo/phase1/npm-audit.json.

- Metro --localhost initially bound only to ::1; ADB reverse could not reach it by IPv4. Restarting with NODE_OPTIONS=--dns-result-order=ipv4first fixed bundle delivery, HTTP 200 verified. LAN mode was rejected by automatic approval review because it exposes the private bundle to the network; the narrower localhost/ADB-reverse alternative succeeded. No LAN server was started.

- Phase 0 audit (2026-10-15): initial root contained only `.harness/AGENTS.md`, `.harness/PLAN.md`, `.harness/TODOLIST.md`. No `docs/`, survey exports, pilot assets, implementation, dependencies, or root `.git`. The historical product-research checkboxes above are inherited assertions, not independently verified research.
- Tooling: Node 24.19.0, npm 11.17.0, Python 3.11.9. Android Studio 2026.2.1 and SDK exist; sandbox could not see SDK but approved host read confirmed it. AVD `Medium_Phone_API_37.0` boots and ADB sees `emulator-5554`; no physical phone connected. Expo Go 57.0.9 installed after a cold start with software graphics. Spike opens and reports Native map ready; screenshot `docs/demo/emulator-phase0.png` shows blank Google tiles and no visible markers/polyline. Full rendering remains unverified; do not mark Phase 0 complete.
- Expo template resolved SDK 57.0.29 / React Native 0.86.3 / React 19.2.3. Router optional peers initially resolved incompatible React DOM/worklets; explicit Expo-resolved React DOM 19.2.3, Reanimated 4.5.1, worklets 0.10.1 fixed dependency validation. Expo Doctor: 21/21 checks pass.
- Sandbox-specific failures: TestClient stalled, localhost requests were forbidden, Hermes could not write bytecode to temp. Host-run tests and export pass; do not misdiagnose these as application defects.
- npm audit reports 29 findings (19 high, 10 moderate), preserved in `docs/demo/npm-audit-phase0.json`. Suggested changes include incompatible SDK upgrades/downgrades; remediation review remains open before deployment.
- Impeccable Windows context launcher failed (`cache_directory_failed`). Existing harness was read directly. No PRODUCT.md/DESIGN.md or visual system invented during the technical spike.

- Observation: No implementation repository state is assumed by this initial plan.
  Evidence: The plan was authored from the Jom! project specification rather than an inspected codebase. The first Codex milestone must inspect the actual repository and update this section with the real state.

- Observation: Real-world pedestrian safety and accessibility datasets may be incomplete or unavailable during the hackathon.
  Evidence: The product documentation explicitly treats a manually audited pilot graph as sufficient for the MVP and requires confidence/freshness indicators.

## Decision Log

- Decision (2026-10-18, Phase 12): Keep existing accessible 48dp primitives, wrapping text, bounded multiline editors, expandable prose and dev-only isolated fixtures. Add loading-on-retry for Community/detail/reports/preferences; announce loading, field-specific hints, expanded state. Synchronous guards also cover auth, image picker and local content flags. Do not change RLS or authentication architecture. Source/semantic tests do not prove spoken reading order.
- Decision (2026-10-18, Phase 12): Category report freshness: flooding/lift/construction 1 day, lighting 7 days, walkway/ramp/crossing/map infrastructure 30 days; explicit expiry takes priority. These configurable presentation thresholds warn about old reports, never verify them or mutate route traversal. Invalid local calendar dates remain unknown. Photos/entrance-specific timestamps are unavailable and are not inferred from a record update. Final contrast token uses existing muted shade for alternate routes; numeric/text selection retained.

- Decision (2026-10-18, Phase 11): theme.motion owns press 120ms, release 100ms, scale .97, step 180ms, ease-out (.23,1,.32,1). Existing Reanimated animates transform/opacity, no per-frame JS updates. Only onboarding/report steps and confirmed publication/report completion use 8dp/.8-opacity entrance. Tabs/ordinary pages immediate. Geometry/width/color update instantly, only .9-to-1 opacity transitions; segment keys stable. Preserve in-flow comparison with explicit expand/collapse rather than custom drag or animated heights that conflict with large-text scrolling. No geographic camera exists.
- Decision (2026-10-18, Phase 11): MotionProvider starts reduced until OS resolves; live events override late initial query. Reduced Motion removes scale/translation; textual selection/errors/progress remain. expo-haptics 57.0.3 uses native Android View.performHapticFeedback (respects system settings) and iOS selection/success; rejected promises never block commits. One per meaningful route selection/confirmed save. Synchronous refs guard duplicate share/report/onboarding/profile writes. Source/native review approved within available environment; release feel and measured performance remain unverified.

- Decision (2026-10-18, Phase 10): Existing backend weakest-edge confidence remains authoritative (High >= .8, Medium >= .5, else Low; incomplete cap .65, stale cap .45). No client scoring. Add structured source list, oldest known update, missing-date count, accessibility completeness and stale flag to the API; missing metadata remains unknown for older responses. last_verified_at remains null because no separate verification evidence exists. Existing demo assessment clock remains explicitly labelled; UI also warns about updates older than 30 real days without recalculating confidence.
- Decision (2026-10-18, Phase 10): Central client presentation policy uses local calendar dates, unknown/future handling, infrastructure/entrance 30 days, lighting 7 days, photos 90 days, community last-walked 30 days. These prototype thresholds are configurable in quality/policy.ts, not evidence of real conditions. Existing server/local temporary expiry remains 24 hours across categories; explicit expires_at wins. Do not infer individual lighting/photo freshness from an aggregate update. Missing category-specific dates stay unknown. Active reports describe reports, not confirmed conditions; expired reports remain history and never alter routing. Clock refreshes every 30 seconds and on app-state change.
- Decision (2026-10-18, Phase 10): Human verification labels are centralized. New content remains Community submitted; confirmed without at least two evidence-backed confirmations shows Confirmation evidence unavailable. No confirmations feature/count is invented. Protected trusted-admin verified state may show Township/venue verified; dates still unknown. No DB/RLS/Storage changes. Detail modal exposes sources and full warnings outside map; contributor accessibility tags remain claims.

- Decision (2026-10-17, Phase 9): Default Supabase persistence; EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (accepts public publishable or legacy anon). Both environment examples contain placeholders; real config exists only in ignored mobile .env.local. Explicit EXPO_PUBLIC_DATA_MODE=local retains the Phase 6–8 factories and labelled local behavior, never activated by a connection failure. Local records are not automatically imported into a new guest identity. Routing API/graph remain independent and unchanged.
- Decision (2026-10-17, Phase 9): Explicit Continue as guest creates an anonymous Supabase authenticated user; persistent AsyncStorage session, foreground refresh, loading/signed-out/error/retry states and keyed preference remount on identity changes. Guest identity survives restart but not app-data removal; no IC/age collection, email UX or account recovery added. Project is free development/hackathon in Singapore. User handled password generation and explicitly confirmed anonymous auth. No credentials are recorded in this plan.
- Decision (2026-10-17, Phase 9): profiles stores exactly six bool needs, nullable detour and completion; owner upsert via load/save. community_routes preserves SharedPath JSON, tags, notes, last-walked, created timestamp and list/get/create. barrier_reports preserves typed category/location/condition and list/create; database owns report time and 24-hour temporary expiry. Two versioned migrations add schema/security and bounded JSON validation. No confirmations table/count: Phase 7 deferred confirmation. One photo_path column in each table matches existing single-photo forms, so no image join table. Hand-maintained schema-aligned Database types are used; CLI generation deferred until CLI authentication, documented in Supabase README.
- Decision (2026-10-17, Phase 9): RLS enables private owner-only profiles and public-read published community data. Inserts/updates/deletes enforce auth.uid ownership. Invoker triggers reject normal-client owner/ID/verification changes; inserts must be community_submitted, confirmed/verified remain trusted-admin only. No service-role credential is used by mobile or tests. Useful feed, owner and expiry indexes exist. Actual two-user public-key integration tests verify owner CRUD, cross-user write/delete denial, ownership spoof rejection, public reads, signed-out writes and verification escalation rejection; assertions never use a privileged client.
- Decision (2026-10-17, Phase 9): One public-read jom-community-images bucket, 10 MiB JPEG/PNG/WebP, paths community-routes/{uid}/{id}/photo.ext and barrier-reports/{uid}/{id}/photo.ext. Upload requires the authenticated user's matching pending record, no Storage UPDATE policy, owner-path delete. File bytes/signatures and size validated before row creation; unpublished row → ArrayBuffer upload → publish metadata → mapped complete model. Failure removes the row before its image, keeping drafts for retry. If row removal fails, retain the photo to avoid an ambiguous successful publication gaining a broken reference. Failed cleanup can leave draft/orphan data and is logged without credentials; production cleanup/abuse quotas/CAPTCHA/moderation are future work. Unit tests cover this ordering and cleanup failure.

- Decision (2026-10-16, Phase 8): BarrierReportRepository list/create uses versioned local collection jom.barriers.v1. BarrierReport stores category, labelled schematic point with optional route ID/waypoint index, details/photo URI, UTC timestamp, temporary/permanent/unknown, verification and optional expiry. Current-route point 1 prefilled and correctable; without route/GPS choose explicit deterministic demo location. No invented segment IDs/GPS. Eight stable category identifiers match harness. All creates force community_submitted. Temporary reports expire for reconfirmation after configurable 24 hours, remain inspectable and never alter engine traversal.
- Decision (2026-10-16, Phase 6–8 QA): reuse Phase 2 solid surfaces, system type, tokens, buttons, badges, schematic, 48dp controls and native scroll/keyboard avoidance. Four-line expandable read summaries preserve full content on demand; forms retain maximum 2,000-character text in a bounded internally scrollable editor. Portrait/light-only remains the supported configuration; no authored animation. Development-only isolated QA screen exposes Demo/Worst/Empty/Failed-save, with repository injection and no writes to actual demo collections. Profile restart clears only preference completion/settings.
- Decision (2026-10-16, Phase 7 follow-up QA): local content flags store route ID/reason/timestamp behind ContentReportRepository and explicitly disclose no moderation service. No server moderation, confirmation counts or verification promotion. Bookmark/confirm remain optional deferred tasks.

- Decision (2026-10-16, Phase 7): CommunityRoute stores id/author/title/notes/purposeTags/SharedPath snapshot (geometry, origin/destination, distance/duration, schematic coordinate system)/accessibilityTags/warnings/photos/lastWalkedAt/createdAt/verificationLevel. No unused counts. Repository list/get/create wraps versioned AsyncStorage collection with serialized read-modify-write; screens depend on interface, allowing Phase 9 replacement. Newly created routes always override caller state to community_submitted. Seeds also visibly simulated/community submitted. Only explicit share action retains selected route in memory; no automatic route history.
- Decision (2026-10-16, Phase 7): Expo ImagePicker 57.0.20, images only, one local URI, max 10 MB when metadata available; no cloud upload. System photo picker does not request broad library access for image selection. Handle cancel, rejection/permission errors, remove/replace and invalid URI fallback. Camera/audio permissions disabled in plugin config. Last-walked ISO date optional; title 100, notes 2,000; require route and purpose; reject contradictory accessibility tags. Save/confirm/moderation deferred; no fake counts or server actions. Reused Phase 2 map/badges/buttons/tokens.

- Decision (2026-10-16, Phase 6): welcome → walking preferences → mobility needs; skip/back supported. No demographic fields. One UserRoutePreferences model, repository version jom.preferences.v1, AsyncStorage 2.2.0 via Expo install; provider publishes only after successful durable save. Profile edits/reset-draft/save reuse PreferenceFields. Initial read failure offers retry without overwriting stored data.
- Decision (2026-10-16, Phase 6): supported bool fields prefer_well_lit/prefer_public_areas add exposure-weighted penalties (weight 2 each, unknown .75); avoid_stairs excludes true/unknown stairs; avoid_steep_slopes excludes unknown or absolute slope >8.33%; max_detour_minutes 0–60 caps against unconstrained fastest baseline and never relaxes constraints. No preference reproduces original route ranking. Covered/shaded and ramps/elevators stored only and explicitly labelled inactive; no isolated-route field without suitable data. Custom deferred to preserve three profile contracts; explicit needs already apply to all profiles. Cache key includes serialized supported preferences.

- Decision (2026-10-16, Phase 4): HTTP models live in services/api/app/models/routes.py, router/dependency in app/api/routes.py. Reuse RouteProfile and RouteConfidence directly. Request: origin/destination {node_id}, profile fastest|safer_at_night|step_free, optional aware departure_time and empty/null preferences. Node IDs resolve directly against cached frozen pilot graph; coordinates/snapping are deliberately unsupported for local synthetic data. departure_time is metadata; fixed demo reference time remains the confidence clock. Reserved preference fields accept null only until engine support exists.
- Decision (2026-10-16, Phase 4): response {dataset_id,data_kind,reference_time,routes:[{id,profile,geometry,distance_m,estimated_time_s,total_cost,reasons,warnings,confidence,verification_summary}]}; geometry {type:LineString,coordinate_system:local_metres_not_geographic,coordinates:[[x,y],...]}. Reasons/warnings and verification are existing domain strings, confidence contains level/factors/as_of. Preserve engine ordering and 1–3 limit; omit internal node/segment paths and raw weight breakdowns. 422 invalid shape/profile/preferences/same endpoints; 404 unknown nodes or no route with distinct details and explicit Step-Free unavailability; 503 search budget; sanitized 500 unexpected calculation failure, details logged server-side. Never fall back through stairs. No browser CORS enabled: native Expo does not require it; a future browser client must use an explicit allowlist.
- Decision (2026-10-16, Phase 5): use EXPO_PUBLIC_API_BASE_URL in apps/mobile/.env.local or process environment. Root .env.example documents public config; no default machine IP in source. ADB reverse supports loopback API on Android emulator/USB phone; emulator alias 10.0.2.2 and trusted-network physical-phone setup are documented. Service owns fetch, JSON serialization, response validation, friendly error categories, external cancellation and 10,000ms timeout including response-body reads.
- Decision (2026-10-16, Phase 5): usePlanner owns trip/profile/results/selected route/loading/error/retry. Clear stale display immediately via request-keyed results, abort on cleanup and ignore obsolete completions. Small in-memory per-trip/profile cache is sufficient for fixed demo data; Retry bypasses that entry. Cards select alternative IDs independently of profile intent. No state library or client scoring added. toDisplayRoutes only formats metrics and projects API local metres into the existing schematic with fixed pilot bounds. Selected line is thicker/drawn last, numbered options identify alternatives, and map legend/card radio states expose selection textually.
- Decision (2026-10-16, Phase 5): retain Phase 2 mock/state stress fixtures in an explicitly development-only DemoPlannerScreen via query parameters. Default and release planner always use HTTP, with no silent mock fallback. Manual places are always available; no live location permission exists or is added. Existing permission-denied preview remains a regression fixture. Long backend explanations/warnings/freshness wrap and scroll in the preserved visual system; no important backend text is truncated.

- Decision (2026-10-16, Phase 3): version-1 strict JSON `services/api/data/pilot/simulated_demo.json`, labelled SIMULATED_DEMO, with 11 generic nodes, 14 directed segments and local metre coordinates. Use frozen NetworkX DiGraph and immutable Pydantic records; reject duplicate nodes/segment IDs/directed pairs, unknown endpoints, self-loops, nonfinite/invalid attributes, unzoned timestamps and mismatched geometry endpoints. Reverse travel requires explicit reverse records. No verified real-world pilot data exists.
- Decision (2026-10-16, Phase 3): NetworkX Yen `shortest_simple_paths` on canonically constructed, hard-filtered graphs; up to 3 candidates, sorted by integer nanocost, time, distance and segment IDs. Inspect entire boundary-cost tie group even for K=1. Budget 2,000 examined candidates raises SearchLimitError rather than silently returning incomplete ranking. Stable SHA-256 path/profile/dataset IDs. Baseline comes from the actual fastest usable path.
- Decision (2026-10-16, Phase 3): cost = time/600 × (wt + ws×environment + wa×accessibility + wc×confidence penalty). Prototype weights (wt,ws,wa,wc): Fastest (1,0,0,0); Safer at Night (1,2,0,.4), capped at 1.5× fastest ETA; Step-Free (1,.1,.5,.5), with hard accessibility exclusions and no forced detour cap. Preference term is zero in this phase. Environmental/accessibility/quality penalties normalized to [0,1]; time remains unbounded to avoid capping long segments. Edge costs quantized to 1e-9 units for deterministic ties. These are configurable demonstration assumptions, not scientifically final weights.
- Decision (2026-10-16, Phase 3): all profiles exclude closed/impassable paths and required lifts not known operational. Step-Free excludes stairs, unknown critical traversal fields, |slope| > prototype 8.33%, narrow/rough paths, inaccessible or unknown-required entrances, and crossings lacking known curb cut/ramp. Unknowns stay unknown and are not silently treated as false. If no eligible path remains, raise NoRouteError. No HTTP adapter or mobile integration added.
- Decision (2026-10-16, Phase 3): isolated confidence module uses source confidence, verification quality, freshness, environmental completeness and critical accessibility completeness; incomplete/community caps .65, stale/missing/future timestamp cap .45, source confidence ceiling. Weakest edge determines High >=.8 / Medium >=.5 / Low. Fixed dataset reference_time by default, explicit aware as_of override. Reasons use selected attributes and fastest baseline; verified proximity requires explicit trusted/recent metadata. Data confidence is not safety probability. Full formulas and limitations in `docs/demo/route-fixture-notes.md`.

- Decision (2026-10-16, Phase 2): use built-in React Native Pressable/Text/View/Modal/ScrollView/Switch/KeyboardAvoidingView and existing safe-area package. pick-ui-library's curated web packages do not cover native planner primitives; no Base UI, sheet library, icon font or state library added. A scrollable comparison surface with an explicit expand/collapse button avoids custom gesture/motion dependencies and keeps all content reachable with large text. Real sheet gesture polish remains later-phase work.
- Decision (2026-10-16, Phase 2): use a labelled local schematic map composed from native geometry, with a thicker selected path drawn last, A/B endpoints and textual selected-mode legend. Preserve native map spike and its unresolved Phase 0 provider issue. Schematic is never geographic guidance; all four mock places share illustrative geometry and fixed ETAs, not calculated trips.
- Decision (2026-10-16, Phase 2): central tokens in `apps/mobile/src/theme/tokens.ts`; light outdoor-readable scheme, deep teal #006653, ink #172F2C, warm neutral #F5F5EF, system font, 14/16/18/24/32 type, 4/8/12/16/24/32/48 spacing, 8/12/16/24 radii, 16/24/32 icon sizes, 48dp minimum controls. Solid surfaces, restrained sheet shadow; no decorative movement. Instant transitions respect reduced motion without extra subscriptions. Light-only matches existing Expo configuration; dark theme and RTL are not claimed supported.
- Decision (2026-10-16, Phase 2): user supplied a detailed map-first production prototype brief and explicitly requested completion with findings fixed. Apply prototype's working interactive mock/recon principles and break-ui's adversarial fixture workflow directly; do not replace this requested milestone with a separate multi-variant design selection or stop before authorized fixes. Skills are guidance subordinate to the explicit scope. No later-phase functionality, routing calculation, APIs, persistence, auth, or live data introduced.

- Decision: Establish a root npm workspace with one root package-lock.json, preserving the Phase 0 npm choice instead of switching to pnpm. Keep Expo Router routes in `apps/mobile/src/app`; preserve the map spike under `/spikes/map` and use a plain three-screen shell as the default entry point. Keep native map dependencies installed but out of scaffold screen rendering.
  Rationale: Minimize package-manager churn and let scaffold acceptance proceed independently of the known Phase 0 map-provider issue. Navigation tests use Jest 29 + jest-expo 57 + React Native Testing Library 13, matching SDK 57 rather than SDK 58 documentation.
  Date: 2026-10-15.

- Decision: All future project pushes must target `https://github.com/aanatidae/jomapplication`, and no push may occur until the user gives explicit full consent and approval for that push.
  Rationale: Explicit user instruction on 2026-10-15. The destination is not authorization to publish; prepare a reviewable local result before seeking approval. No Git remote changes or pushes were made for this documentation update.
  Date/Author: 2026-10-15 / User and Codex.

- Decision: Retain default Expo + TypeScript + Expo Router and FastAPI + NetworkX architecture; provisionally use react-native-maps 1.27.2, selected by Expo SDK 57 bundledNativeModules.json and official docs (https://docs.expo.dev/versions/v57.0.0/sdk/map-view/). Native map initializes in Expo Go but tiles/overlays remain blank on this AVD; rendering acceptance is pending. Expo Go requires no separate Google key; standalone Android builds will need a restricted Maps SDK key.
  Date/Author: 2026-10-15 / Codex.
- Decision: Keep Phase 0 deliberately small: temporary `POST /spikes/route`, three simulated nodes, Dijkstra weighted by time, no production profile logic or UI. Phase 3/4 own the full engine and `/v1/routes` contract.
  Date/Author: 2026-10-15 / Codex.
- Decision: Use npm for the isolated Phase 0 app generated by create-expo-app; settle root pnpm workspace in Phase 1 rather than maintain two lockfiles now. The generator also initialized a nested uncommitted `apps/mobile/.git`; retain and document until root Git setup is addressed. No unrelated existing code was present or modified.
  Date/Author: 2026-10-15 / Codex.

- Decision: Support Android Studio emulator and physical Android phone; Expo Go is permitted for testing.
  Rationale: Explicit user clarification on 2026-10-15. Android Studio is installed at `C:/Program Files/Android/Android Studio`; SDK is at `C:/Users/SawJu/AppData/Local/Android/Sdk` (requires host access because sandbox reads misleadingly report it absent). Native rendering remains unverified until observed on an available target.
  Date/Author: 2026-10-15 / User and Codex.

- Decision: Use React Native with Expo and TypeScript for the mobile MVP unless an existing repository already has a coherent mobile stack.
  Rationale: The installed `mobile-native` and `animate-expo` skills directly support this approach; Expo also enables fast cross-platform iteration for a three-person hackathon team.
  Date/Author: 2026-10-15 / Initial plan.

- Decision: Use Python FastAPI and NetworkX for the routing service.
  Rationale: The project requires a transparent weighted-graph routing algorithm. Python and NetworkX make route-cost logic easy to inspect, test, and explain to judges.
  Date/Author: 2026-10-15 / Initial plan.

- Decision: Use Supabase for authentication, community-route data, barrier reports, and photo storage.
  Rationale: It provides fast hackathon-friendly persistence and access control while keeping route computation in a separate service.
  Date/Author: 2026-10-15 / Initial plan.

- Decision: The minimum demonstrable routing profiles are Fastest, Safer at Night, and Step-Free.
  Rationale: These are the three profiles explicitly called out as the minimum demonstrable set in the project documentation and they create clear route trade-offs for judges.
  Date/Author: 2026-10-15 / Initial plan.

- Decision: Do not require a full IC number.
  Rationale: It is unnecessary for routing, adds privacy risk, and route needs should be collected directly.
  Date/Author: 2026-10-15 / Initial plan.

- Decision: Real-world route safety must never be presented as guaranteed.
  Rationale: Lighting, public activity, security proximity, and reports are imperfect indicators that change over time.
  Date/Author: 2026-10-15 / Initial plan.

- Decision: Until the team supplies or verifies real pilot data, route fixtures must be labelled simulated/demo data.
  Rationale: The prototype should not fabricate safety or accessibility claims about real places.
  Date/Author: 2026-10-15 / Initial plan.

## Outcomes & Retrospective

Phases 10, 11 and 12 implemented in order with separate passing gates (85, 88, then 97 mobile tests; 121 API tests). Backend confidence remains authoritative; structured provenance and cautious data-quality UI cover Planner/details, community and reports. Verification dates/evidence that do not exist remain unknown, existing server-protected verification remains intact, and expired/stale reports remain inspectable history. Reanimated press/selection and occasional step/completion feedback respect live Reduce Motion; real persistence precedes success feedback. Stress testing fixed retry/semantic/concurrency/contrast findings. Available Android native and automated acceptance is complete; no physical Android/iOS/spoken TalkBack/VoiceOver/release-FPS acceptance is asserted. No known scoped P0/significant P1 remains. See docs/demo/ui-accessibility-qa.md and phase10/phase11/phase12 evidence. No Phase 13/14, commit or push. Historical outcomes below retain their original scope.

Phase 9 is complete for the requested hackathon scope. A fresh Jom! free Singapore project runs real anonymous authentication, private preferences, public community routes/reports and owner-scoped photo storage. Two versioned migrations, bounded JSON models, RLS and verification/ownership guards are deployed and inspected. The same repository interfaces now use Supabase by default, with explicit labelled local mode retained. Native Android verified guest onboarding, saved preferences after restart, shared photo route after restart, and active-route temporary photo report after restart. Two independent real guest clients proved ownership restrictions, public reads, verification escalation denial, image restrictions and restored-session persistence using only a public key. No service-role/database secret entered the app.

Final checks: original Expo lint and strict TypeScript pass, 79 tests/11 suites pass, Ruff clean/119 API tests pass, Android production export succeeds and git diff --check is clean. Baseline dependency entries are unchanged; ten required entries added. Docker-local tests were not possible; hosted validation was real. Schema-aligned types are maintained locally rather than CLI-generated. Guest recovery/offline sync, production moderation/quotas and orphan/auth-identity cleanup remain documented limitations; existing Expo patch advisories remain outside scope. Setup commands, seeds, actual evidence and recovery limits are in README, supabase/README.md and docs/demo/phase9/results.md. No commit/push or later-phase work. Earlier outcomes below describe their historical milestone scopes.

Historical Phases 6, 7 and 8 outcome: complete for the requested local hackathon scope, implemented in order. A first-run user can set explicit needs, edit them in Profile, request routes with supported constraints/preferences, browse/open/share a community route and report/inspect a temporary barrier. All newly created community routes and barrier reports remain Community submitted. At that milestone local persistence was behind replaceable services and Phase 9 had no implementation; see the current Phase 9 outcome above. No Custom profile, demographic/IC collection, production moderation or authored animation was added. Covered/shaded and ramps/elevators remain visibly stored-only.

Final evidence after clean installation: mobile lint and strict typecheck pass; 65 tests across 9 suites pass; API Ruff and 119 Pytests pass; live health returns 200; Android Hermes production export succeeds. Native Android happy flow, restart persistence, actual image picker selection and 320dp/200% worst-case form submissions verified. Fixes, fixtures, commands and screenshots are documented in docs/demo/phase678/results.md. Native map-provider issue, physical phone, iOS and spoken TalkBack remain limitations. No commit/push performed. Historical outcomes below describe their original milestone scopes.

Phases 4 and 5 are complete for the requested simulated pilot. Full mobile → FastAPI → existing engine → geometry/cards flow works on Android Studio Expo Go. Same primary trip selects three distinct preferred paths at 8/10/12 minutes, with truthful server reasons, explicit unknown accessibility and data-quality freshness. Native QA verified an alternative route, single-option Step-Free, no-route without fallback, connection failure/retry, loading, actual 10-second timeout/retry and long text at 320dp/200% scale. Final gates: Ruff clean, 107 backend tests (15 HTTP contract cases), npm run check clean with 35 mobile tests, live health 200. Evidence is docs/demo/phase45/. No new dependencies or domain scoring changes. Phase 0 geographic provider rendering, physical phone, iOS and spoken TalkBack remain separately unverified; no later phases implemented. Work remains local, uncommitted and unpushed.

Phase 3 is fully complete for the offline domain scope. The 11-node/14-segment versioned synthetic graph produces the intended three preferred families for one trip: Fastest A (8min,600m), Safer at Night B (10min,720m,+2min, lighting/public/verified-proximity indicators), Step-Free C (12min,830m,+4min, stairs excluded, ramp/curb cuts/recorded entrances). Unknown values are preserved; no eligible Step-Free path yields NoRouteError rather than an inaccessible fallback. Confidence is data quality with a fixed demo reference time; B is Medium because two segments have incomplete accessibility metadata. A/C are High data confidence, not safety/accessibility guarantees.

Final validation: `./.venv/Scripts/python.exe -m ruff check services/api` clean; `./.venv/Scripts/python.exe -m pytest services/api/tests` 92 passed (89 new domain cases, 3 existing); `npm run check` passes lint, typecheck, 14 tests; `git diff --check` clean. Offline CLI output inspected and saved. Internal models live alongside the routing domain to avoid creating premature public HTTP contracts. Existing main.py endpoints and every mobile file remain unchanged. No dependency installed. Prototype weights, thresholds, directed-only topology, 2,000-candidate budget and nanocost precision are documented limitations; no real pilot claims or nationwide scalability claims. Native map-provider/hardware limitations remain separate earlier-phase work. No commit or push performed for Phase 3.

Phase 2 is complete against the user's design-system and deterministic mock-planner requirements. Tokens live in `apps/mobile/src/theme/tokens.ts`; semantic reusable buttons, profile chips, cards, reason/confidence badges, place picker, comparison surface and state primitive live under components/planner. Planner route stays thin. Selection updates selected card ordering and thicker schematic geometry; all 8/10/12 minute trade-offs, distances, reasons and demo freshness are visible. Community/Profile retain their shells with shared tokens. No component dependency added. Release builds omit QA controls and ignore fixture query parameters. `DESIGN.md`, `PRODUCT.md` and `.impeccable/design.json` describe the implemented system and explicitly defer to the harness.

Final gates: `npm run check` passed on host (mobile lint, strict typecheck, 14 interaction/navigation tests); `git diff --check` passed. Native manual QA and break-ui findings/fixes are recorded in `docs/demo/phase2/results.md`. Independent review found one recovery-action mismatch; corrected, tested, manually captured and scored resolved with scoped SHIP verdict. Phase 0 native provider tiles remain unverified and physical phone/spoken TalkBack checks remain limitations, not claimed completions. The schematic is intentionally local demo data. Later routing, API, Supabase, authentication, community and animation phases remain untouched. All work remains local and reviewable; no commit or push performed.

Phase 1 is complete against its scaffold acceptance criteria. The npm workspace installs from one root lockfile; the mobile shell and FastAPI health service run locally; all three screens are reachable; lint, strict types, 3 mobile tests, Ruff and 3 API tests pass. README commands, environment template, ignore coverage, SDK compatibility and Android export are verified. Native manual checks used Android Studio's existing emulator with Expo Go, including 320dp/200% font scaling. Physical phone not connected; this is not claimed as tested. No new routing engine work, Supabase integration, design system, identity collection, or animations were introduced. Phase 0's map-provider rendering issue and dependency audit remediation remain open and do not prevent the Phase 1 shell checks. Git metadata and attribution were left untouched; no commit or push performed.

Phase 0 implementation: API health and deterministic route HTTP spike work; three Pytest tests and Ruff pass. Mobile lint, strict TypeScript, Expo dependency check, Expo Doctor (21/21), and Android Hermes production export pass. Native initialization on the Android Studio emulator is verified, but map tiles/overlays remain blank. Full map rendering and physical-device acceptance remain pending; Phase 0 is not marked complete. No production UI, route profiles, community features, or persistence implemented.

## Context and Orientation

Phase 3 paths: `services/api/app/routing/` (`models`, `graph_loader`, `profiles`, `scoring`, `engine`, `explanations`, `confidence`, `errors`, offline `demo`); `services/api/data/pilot/simulated_demo.json`; `services/api/tests/test_routing.py`; `docs/demo/route-fixture-notes.md`; `docs/demo/phase3-routing-results.txt`. To inspect without starting a server: `./.venv/Scripts/python.exe -m services.api.app.routing.demo`. Phase 4/5 now add app/models/routes.py and app/api/routes.py, tests/test_routes_api.py, mobile src/services/routingApi.ts and planner usePlanner/routePresentation/ApiPlannerState; HTTP and native evidence live in docs/demo/phase45/.

Phase 1 paths: root `package.json`/`package-lock.json` (npm workspace); `scripts/expo.cjs` (portable Expo resolution); `apps/mobile/src/app/(main)/` (Planner, Community, Profile and responsive navigation); `apps/mobile/src/components/ScreenShell.tsx`; `apps/mobile/__tests__/navigation.test.tsx`; `services/api/tests/test_health.py`; root `.env.example` and `.gitignore`. The original map spike was preserved at `apps/mobile/src/app/spikes/map.tsx`; `/` now opens Planner. The app-local lockfile was superseded by the verified root lockfile.

Actual Phase 0 paths: `apps/mobile/src/app/index.tsx` (native map spike), `apps/mobile/src/app/_layout.tsx` (Router), `services/api/app/main.py` (health and simulated routing), `services/api/tests/test_spike.py` (3 transport/route tests), `pyproject.toml` (Python checks), `README.md` (tested commands and Android target instructions). `.harness/` remains the guidance authority; do not create divergent root guidance copies. `services/api/requirements-lock.txt` records the installed Python environment.

Jom! is a mobile pedestrian route planner for the Sime Darby Property University Hackathon 2026 under the PEOPLE challenge. The app targets mobility, safety and security, accessibility and inclusion, healthy lifestyles, digital living, and neighbourhood connection.

The route engine uses a pedestrian graph. A graph is a network of nodes and edges. A node is a meaningful point such as an intersection, entrance, crossing, ramp, elevator, or waypoint. An edge is a walkable segment between two nodes. Each edge stores normal routing data such as distance and time plus Jom!-specific data such as lighting, stairs, slope, crossing quality, path surface, security/public-facility proximity, verification source, and confidence.

A route profile changes the cost assigned to edges. Lower-cost routes are preferred. Fastest heavily weights time. Safer at Night increases the weight of environmental safety indicators. Step-Free treats stairs and known inaccessible barriers as hard exclusions.

The mobile client should not implement a second copy of the routing algorithm. It sends the trip request and preferences to the routing API and renders the returned route options and reasons.

The initial repository layout, if the repository is empty, is:

    apps/mobile/             Expo/React Native client
    services/api/            FastAPI routing service
    services/api/data/pilot/ Pilot graph/GeoJSON fixtures
    supabase/                Database migrations and seed data
    docs/                    Product/demo/reference notes
    scripts/                 Utility scripts

The routing API owns route calculation. Supabase owns user/community persistence. The mobile app owns interaction and presentation.

## Product behavior that must exist

The home experience is map-first. A user chooses an origin and destination, then sees route-profile controls and a bottom sheet or equivalent route comparison. The same trip should be able to produce meaningfully different routes.

Each route result must contain an ETA, distance, route mode, a few explanation reasons, and a confidence/freshness representation. A reason must be derived from actual route attributes rather than invented UI copy.

A barrier-report flow lets a user select a location/segment and report a problem such as a blocked walkway, lift outage, missing ramp, construction, poor lighting, flooded path, unsafe crossing, or incorrect map connection. Community submissions are visibly unverified until they meet the chosen confirmation or official-verification rules.

A route-sharing flow lets a user publish a route with a title, purpose tags, optional photos, notes, accessibility tags, and a “last walked” date.

## Architecture

The default architecture is a small monorepo-like repository with an Expo mobile app and a FastAPI service.

The mobile app uses Expo Router for screen navigation and TypeScript strict mode. Data fetching should be isolated behind service modules or hooks. Presentational components should not directly call the network.

The API uses FastAPI and Pydantic models. The routing package should be divided so graph loading, edge scoring, route generation, explanation generation, and confidence calculation can be tested independently.

Supabase should be introduced after the core route engine works, not before. The app can begin with a local development identity or mocked community data, then switch the community flows to Supabase once routing and UI are stable.

## Data model

The pilot graph should use a versioned file format under `services/api/data/pilot/`. GeoJSON is useful for geometry, but a JSON graph fixture is acceptable if it is easier to test. The important requirement is that the same source of truth drives both route geometry and route-scoring attributes.

Each edge should support, where known:

    segment_id
    start_node
    end_node
    geometry
    distance_m
    estimated_time_s
    lighting_score
    crossing_score
    visibility_activity_score
    security_facility_distance_m
    stairs
    ramp
    curb_cut
    slope_percent
    width_category
    surface_quality
    elevator_required
    elevator_status
    accessible_entrance
    is_closed
    source
    verification_level
    confidence_score
    last_updated_at

Unknown fields must remain unknown. The graph loader must not coerce missing accessibility values into positive accessibility claims.

## Route scoring

Keep profile weights in one configuration module, for example `services/api/app/routing/profiles.py`.

The conceptual edge cost is:

    cost =
        time_weight * time_penalty
        + safety_weight * safety_penalty
        + accessibility_weight * accessibility_penalty
        + preference_weight * preference_mismatch
        + confidence_weight * confidence_penalty

For the first fixture implementation, normalise penalties into consistent ranges so no single field dominates accidentally.

Fastest should strongly weight `estimated_time_s`.

Safer at Night should increase penalties for poor or unknown lighting, isolated/low-activity segments, risky crossings, and routes far from verified staffed public/security facilities. It should still consider time so that extremely large detours are not chosen without a clear reason.

Step-Free should exclude any edge with confirmed stairs when no step-free traversal exists. It should prefer curb cuts, ramps, usable elevators, manageable slopes, and verified accessible entrances. Missing accessibility data should reduce confidence and, where necessary, make a route unavailable rather than falsely accessible.

Custom can be added after the three required profiles work.

## API interfaces

Create a health endpoint:

    GET /health

Expected development response:

    HTTP 200
    {"status":"ok"}

Create a route endpoint:

    POST /v1/routes

The request model should be named `RouteRequest` and should contain an origin, destination, profile, optional departure time, and a `RoutePreferences` object.

For the first pilot, origin and destination may be node identifiers plus optional lat/lng. If a map search produces coordinates, a snapping function should map them to the nearest valid pilot node.

The response should be named `RouteResponse` and return a list of `RouteOption` objects. A route option should include:

    id
    profile
    geometry
    distance_m
    estimated_time_s
    total_cost
    reasons
    warnings
    confidence
    verification_summary

The route response should not expose raw internal weighting details by default. A development-only debug field may be enabled with configuration if it helps testing.

## Mobile interfaces

Create a typed API client in `apps/mobile/src/services/routingApi.ts`.

The main route-planning state should live in a feature module such as `apps/mobile/src/features/planner/`.

Suggested components include:

    MapCanvas
    TripSearchBar
    RouteProfileSelector
    RouteOptionCard
    RouteComparisonSheet
    RouteReasonBadge
    ConfidenceBadge
    BarrierReportSheet
    CommunityRouteCard

Component names may change if the repository already has conventions, but responsibilities should remain separated.

The UI needs complete states for:

- idle
- selecting origin
- selecting destination
- loading routes
- routes loaded
- no route found
- API failure/timeout
- location permission denied
- route contains unknown data

## Design and skill workflow

Before implementing the design system, Codex must read the skill files required in `AGENTS.md`. The design phase should begin with a lightweight prototype rather than immediately coding every screen.

The design system should establish typography, spacing, radius, map overlay hierarchy, route profile semantics, verification/confidence states, bottom-sheet behavior, button/chip variants, and loading/empty/error patterns.

Use `prototype`, `pick-ui-library`, `impeccable`, `mobile-native`, `apple-design`, `emil-design-eng`, and `ui-skills-root` during this phase.

After flows work, use the animation skills to identify a small number of useful transitions, such as route-profile switching, bottom-sheet transitions, route-card selection, and report submission. Then use `review-animations` and `break-ui` before sign-off.

The final design should prioritize one-handed use, readability outdoors, accessibility, and rapid route comparison.

## Plan of Work

### Milestone 0: Audit the repository and de-risk the technical choices

Codex first inspects the entire repository, current Git state, existing package manifests, source folders, and any prior prototype. It records the real structure in this plan rather than assuming the repository is empty.

Then Codex reads the required design/mobile skills and performs two short spikes if needed: one to confirm the current Expo SDK and map library work together, and one to confirm the FastAPI/NetworkX service can return a GeoJSON-like route payload from a tiny graph fixture.

At the end of this milestone, there is a written technical decision in `Decision Log`, the development commands are known, and neither mapping nor routing is a speculative dependency.

Acceptance is observable: the mobile spike renders a map or map fallback without crashing, and `GET /health` returns HTTP 200.

### Milestone 1: Scaffold the app, API, and quality gates

Create or normalize the project structure. Configure Expo Router, TypeScript strict mode, ESLint, formatting, test scripts, FastAPI, Ruff, and Pytest. Add `.env.example` and ensure secrets are excluded from Git.

Create a simple mobile shell with placeholder tabs or stack navigation for Planner, Community, and Profile. The shell does not need final visual polish yet.

At the end, both projects start locally and the baseline lint/type/test commands pass.

### Milestone 2: Establish the Jom! design system and primary mobile shell

Use the installed design skills before finalizing any visual language. Build theme tokens and reusable primitives first. Implement the map-first planner layout, trip search, route-profile selector, and route-comparison sheet using placeholder route data.

The route sheet must visually communicate ETA, detour amount, accessibility/safety reasons, and confidence. It must remain usable on small screens and with large text.

Use `break-ui` on this milestone before moving on.

Acceptance is a polished mock flow in which a user can switch among Fastest, Safer at Night, and Step-Free and clearly understand the route-card hierarchy, even though route data may still be local.

### Milestone 3: Build the deterministic routing engine

Create a small, explicit graph fixture that contains at least three alternate paths between the same origin and destination:

- a shortest path that contains weaker lighting or an inaccessible segment,
- a slightly longer better-lit path near active/public or verified staffed facilities,
- a step-free path that avoids stairs.

The fixture must be labelled simulated unless it is based on team-verified real pilot data.

Implement graph loading, profile configuration, edge-cost functions, hard constraints, route generation, explanation generation, and confidence calculation. Add deterministic tests.

Acceptance requires tests proving that Fastest selects the shortest-time route, Safer at Night can select the better-lit route, and Step-Free never chooses the stairs edge. Route reasons must agree with fixture attributes.

### Milestone 4: Integrate mobile planner with the routing API

Replace placeholder planner data with the API client. The app sends trip/profile/preferences and receives 1–3 route options. Render route geometry and route cards from the same response.

Changing the profile must update the selected route and visible explanations. Loading, timeout, no-route, and API-error states must be complete.

Acceptance is an end-to-end demo from mobile interaction to API route calculation for the fixture trip.

### Milestone 5: Implement onboarding and explicit preferences

Build onboarding that asks what matters to the user rather than inferring needs from identity. Preferences can include avoid stairs, prefer well-lit paths, avoid steep slopes, prefer covered/shaded walkways, prefer active/public areas, and maximum acceptable detour.

An optional age bracket may exist only if product needs justify it. There is no full IC field.

Preferences should be editable from Profile and should feed into the custom routing request when Custom mode is implemented.

Acceptance is a complete onboarding flow whose saved settings persist locally and, once authenticated persistence exists, sync appropriately.

### Milestone 6: Add community route sharing and barrier reporting

Implement Share Route and Report Barrier flows. Begin with local/mock persistence if necessary, then wire to Supabase in the next milestone.

A shared route includes title, tags, notes, optional image references, accessibility tags, and last-walked date.

A barrier report includes category, location/segment, optional photo, description, timestamp, and temporary/permanent state.

Community content must show its verification level. A newly submitted item is never “verified”.

Acceptance is a user-visible flow that can create and then view a route post and a barrier report.

### Milestone 7: Add Supabase authentication, persistence, storage, and RLS

Create migrations for profiles, route posts, route post images, barrier reports, confirmations, and any small supporting tables that are genuinely needed. Keep the schema minimal.

Add Row Level Security so users can edit their own posts/reports and read public community content according to the app rules. Do not ship a service-role key to the client.

Wire authentication and image uploads. Use friendly guest/demo behavior if the full sign-in flow would otherwise block the hackathon demonstration.

Acceptance includes passing a basic security review of RLS policies and demonstrating persistence across app restarts/accounts as appropriate.

### Milestone 8: Add confidence, freshness, verification, and resilient states

Make data quality visible in route cards and community items. Add confidence and last-verified labels without overwhelming the map.

Implement the key degraded states: route segment has unknown accessibility, community report expired, route has stale data, location permission denied, map/search unavailable, and API unavailable.

The product must never convert uncertainty into a positive claim.

Acceptance is a set of fixtures or development toggles that allow each degraded state to be demonstrated.

### Milestone 9: Polish interaction, animation, accessibility, and visual QA

Read and apply `find-animation-opportunities`, `animate-expo`, `improve-animations`, and `review-animations`. Add only high-value motion: route changes, bottom-sheet transitions, selected-route emphasis, and completion feedback.

Honor Reduce Motion. Verify screen-reader labels, large text, touch targets, non-color status cues, keyboard behavior, and Android/iOS differences.

Apply `break-ui` against the core screens and fix the problems it exposes.

Acceptance is a polished app with no major layout breaks on small devices or large text settings and no essential information conveyed only through animation or color.

### Milestone 10: Demo hardening and submission readiness

Prepare three deterministic demo scenarios:

1. Night walk: Fastest versus a slightly longer better-lit route.
2. Step-free trip: shortest route contains stairs; accessible route is longer.
3. Community update: user reports a temporary barrier or shares a shortcut.

Create demo reset/seed scripts so the team can recover quickly if data changes before the presentation.

Run every quality gate, rehearse the five-minute flow, and document exact startup commands in `README.md`.

Acceptance is a fresh-clone rehearsal in which another team member can start the API and mobile app from the README and complete all three scenarios.

## Concrete Steps

### Current verified Phase 4/5 workflow (2026-10-16)

From root (npm workspaces, not pnpm):

    npm ci
    npm run check
    npm start
    npm exec --workspace mobile -- expo install --check
    npm exec --workspace mobile -- expo-doctor
    npm exec --workspace mobile -- expo export --platform android

Separate mobile gates: `npm run lint`, `npm run typecheck`, `npm test`. App equivalents: `npm run lint --workspace mobile`, `npm run typecheck --workspace mobile`, `npm test --workspace mobile`.

Python (Windows):

    python -m venv .venv
    ./.venv/Scripts/python.exe -m pip install -r services/api/requirements-lock.txt
    ./.venv/Scripts/python.exe -m uvicorn services.api.app.main:app --reload --host 127.0.0.1 --port 8000
    ./.venv/Scripts/python.exe -m ruff check services/api
    ./.venv/Scripts/python.exe -m pytest services/api/tests

On macOS/Linux use `.venv/bin/python`. The frozen Python requirements were verified against the local environment with pip --no-index; initial creation/download was done in Phase 0. Health: GET http://127.0.0.1:8000/health -> 200 {"status":"ok"}.

Android: start the AVD in Android Studio; set ANDROID_HOME to the actual SDK path; run `adb -s <serial> reverse tcp:8081 tcp:8081`, then `npm start`, then open exp://127.0.0.1:8081 in Expo Go. The startup helper uses IPv4-first localhost and resolves Expo whether nested or hoisted. For a physical phone use its ADB serial. For Phase 5 copy .env.example to apps/mobile/.env.local, set EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000, and also reverse tcp:8000 tcp:8000. No credentials needed. See README for emulator-alias and physical-device alternatives.

### Historical Phase 0 commands (superseded by Phase 1)

Retained as historical spike commands. Use the current Phase 1 workflow above and README; do not recreate the Expo scaffold.

    cd apps/mobile
    npm ci
    npm run lint
    npm run typecheck
    npx expo install --check
    npx expo-doctor
    npx expo export --platform android
    npm run android

From root:

    ./.venv/Scripts/python.exe -m pip install -r services/api/requirements-lock.txt
    ./.venv/Scripts/python.exe -m pytest services/api/tests
    ./.venv/Scripts/python.exe -m ruff check services/api
    ./.venv/Scripts/python.exe -m uvicorn services.api.app.main:app --port 8000

Verified HTTP requests: `GET /health` -> 200 and `POST /spikes/route` with `{}` -> 200, 120 seconds and 3 LineString coordinates. No mobile unit suite exists yet. Production startup and native map checks are separate from successful bundle export.

### Current routing demo

Start Uvicorn in terminal 1 and npm start in terminal 2 using the commands above. Set EXPO_PUBLIC_API_BASE_URL before starting Expo. Android USB/emulator: reverse API 8000 and Metro 8081. Select Transit Stop → Residential Block and switch Fastest → Safer at Night → Step-Free; observe 8/10/12 minutes and distinct selected geometry. No code/data edits required. The final QA used isolated Metro 8082 to preserve an existing user server; that port also needs its own ADB reverse if reused.

## Validation and Acceptance

The final MVP must pass automated tests and a human-observable demo.

For routing, create a fixture such as `services/api/tests/fixtures/demo_graph.json` and tests with stable names similar to:

    test_fastest_profile_prefers_shortest_time
    test_safer_at_night_prefers_better_lit_route
    test_step_free_excludes_stairs
    test_closed_edge_is_excluded
    test_unknown_accessibility_reduces_confidence
    test_reasons_match_selected_route_attributes

The API contract test should call `POST /v1/routes` and assert that the response contains route geometry, ETA, reasons, and confidence.

For mobile, validate:

- origin and destination can be selected,
- all three required profiles can be selected,
- route cards visibly change,
- no-route and timeout states are understandable,
- route reasons have accessibility labels,
- a barrier report can be created,
- a community route can be created/viewed,
- Reduce Motion does not remove essential state feedback.

Human acceptance scenario:

1. Start API and mobile app.
2. Choose the seeded origin/destination.
3. Select Fastest and observe the shortest ETA.
4. Select Safer at Night and observe a different route with an explanation such as better lighting and a small time trade-off.
5. Select Step-Free and observe that the stairs path is excluded.
6. Open a route card and inspect confidence/freshness.
7. Submit a barrier report.
8. Open Community and see or create a route post.

The demo passes only if all eight steps work without manually editing data during the flow.

## Idempotence and Recovery

Scaffolding and migration steps should be written so they can be rerun safely or clearly report that they already exist.

Never reset or destroy a user's Supabase project automatically. Seed scripts may delete and recreate only records explicitly tagged as demo data.

Keep a deterministic local/demo dataset in the repository so the routing demonstration does not depend on a live external data source.

If a map SDK becomes incompatible with the current Expo SDK, keep the routing and planner state independent of the renderer. Replace only the `MapCanvas` implementation and record the dependency decision in `Decision Log`.

If a database migration fails, fix the migration or add a follow-up migration; do not rewrite already-applied production migrations.

If API connectivity fails during the pitch, the app may have an explicitly labelled demo fallback using the same deterministic fixture responses. This fallback must not masquerade as live routing.

## Artifacts and Notes

Keep important demonstration artifacts under `docs/demo/`, for example:

    docs/demo/demo-scenarios.md
    docs/demo/route-fixture-notes.md
    docs/demo/known-limitations.md

Keep product research/reference material under `docs/reference/`.

For every major design milestone, capture at least one screenshot per core screen so visual regressions can be compared during later passes. Do not commit secrets or private survey respondent data.

The key pitch behavior to preserve is:

    Fastest: 8 min
    Safer at Night: 10–12 min, better lighting / public activity
    Step-Free: 11–13 min, avoids stairs

Exact values may change with the final pilot graph, but the trade-off must remain clear.

## Interfaces and Dependencies

The mobile app should expose one routing service abstraction so screens are decoupled from transport details.

In `apps/mobile/src/services/routingApi.ts`, provide an interface equivalent to:

    planRoutes(request: RouteRequest): Promise<RouteResponse>

The planner feature should consume that abstraction rather than call `fetch` directly from screen components.

In `services/api/app/models/routes.py`, define Pydantic models equivalent to:

    RouteProfile
    RoutePreferences
    RoutePoint
    RouteRequest
    RouteReason
    RouteOption
    RouteResponse

In `services/api/app/routing/engine.py`, expose a function equivalent to:

    compute_routes(graph, request) -> list[RouteOption]

In `services/api/app/routing/scoring.py`, isolate:

    edge_cost(edge, profile, preferences, context) -> float
    is_edge_allowed(edge, profile, preferences) -> bool

In `services/api/app/routing/explanations.py`, isolate:

    build_route_reasons(route_edges, profile, baseline_route) -> list[RouteReason]

In `services/api/app/routing/confidence.py`, isolate:

    compute_route_confidence(route_edges) -> confidence result

The Supabase client in the mobile app should be isolated under `apps/mobile/src/services/supabase/` or the repository's equivalent service layer.

Prefer stable, well-supported dependencies. Do not add a large UI kit until `pick-ui-library` has been consulted. If the skills recommend composing native primitives rather than adding a kit, prefer the smaller dependency surface.

## Revision Notes

2026-10-15: Initial ExecPlan created from the Jom! product documentation, survey findings, hackathon MVP requirements, AGENTS.md conventions, and OpenAI ExecPlan guidance. The plan intentionally starts with repository and map-SDK discovery because the actual implementation repository has not yet been inspected.

2026-10-16: Phases 4/5 implemented and verified; HTTP contract, error/CORS decisions, node-only resolution, environment URL, planner state/cache, local geometry projection and timeout documented. Current commands supersede scaffold-era pnpm examples.

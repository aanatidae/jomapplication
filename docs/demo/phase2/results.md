# Phase 2 verification — 2026-10-16

Scope: design system and deterministic local planner only. Harness remains the execution authority. Native map-provider spike is preserved and still unresolved under Phase 0; this prototype uses an explicitly labelled schematic, never geographic directions.

## Direction contract

THESIS: Same origin and destination, three needs, three explainable mock choices. Operate mode: readable pedestrian planning, restrained mobile controls, no dashboard metrics.

OWN-WORLD: Deep teal selection, green-tinted neutrals, native system type, solid surfaces, restrained comparison elevation, 48dp controls. Typography, spacing, shapes, semantic colors and motion policy live in `apps/mobile/src/theme/tokens.ts`.

STORY: Pick two local places, compare 8/10/12-minute routes, select a priority, inspect reasons and data quality. Conditions are indicators rather than guarantees.

FIRST VIEWPORT: Trip fields above a dominant schematic canvas; selected route has a thicker line, textual legend and A/B markers. Comparison follows the canvas, with wrapping profile controls and selected card first. At large text, all content stays in one scroll flow.

FORM: User-specified map-first planner with a comparison container; code-led implementation. The supplied brief overrides separate design-choice approval rounds. No generated assets or visual comp.

FINISH: Independent native review, verified states and checks, DESIGN.md and token sidecar. No shipping raster assets; screenshots below are QA evidence, not product artwork.

## Data surface / break-ui field inventory

| Value | Source | Boundary / stress case |
| --- | --- | --- |
| Origin / destination | Four local place options | Fixed list; stress destination is a realistic long entrance description, wrapped in full |
| Place search query | Local TextInput | Unbounded transient filter; no storage/API; no match and clear/cancel recoveries |
| Profile / selection | Typed three-profile union | All modes, card and chip selection, expanded and collapsed comparison |
| ETA / distance / detour | Deterministic mock route fixture | 8 min/600m, 10 min/720m/+2, 12 min/830m/+4; no calculation from places |
| Reasons | MockRoute string array | Normal 2–3; stress 6–7 including long phrases; wrapping, scrollable |
| Confidence / freshness | Typed quality + strings | High confidence, community submitted/unverified, unknown; long community label; unknown overrides stress labels |
| Route list | Three fixed options | 3 expanded, 1 collapsed, 0 for unavailable/no-route; no 1,000-row use case |
| Route geometry | Local normalized canvas points | Shared endpoints, overlapping lines; selected drawn last, thicker and textually labelled |
| Status / recovery | DemoState union | Loading, empty, map unavailable, permission denied, route data unavailable, unknown accessibility, generic error, retry |
| Environment | Existing Android Studio AVD / Expo Go 57 | Normal phone, 320dp width / 640dp height, 200% system font, IME open; original settings restored |

No avatars, remote images, identity fields, currencies, live timestamps, API payloads or community collections exist in this phase. Dark theme and RTL are not supported; existing Expo light-only configuration retained.

## Findings and fixes

| Severity | Before | After / location | Why |
| --- | --- | --- | --- |
| Broken | Large map legend/footer overlap endpoints at 200% | Labels in normal flow outside drawing; `MapCanvas.tsx` | Content can grow without hiding geometry |
| Broken | Fixed A/B marker clips large text | Marker dimensions scale with fontScale; `MapCanvas.tsx` | Full endpoint identifiers remain readable |
| Broken | Stress confidence could overwrite unknown accessibility | Unknown fixture takes priority; `mockRoutes.ts` | Missing data never becomes a positive claim |
| Fragile | Failure state retained a selected route line/ETA | Unavailable/loading map has no path or selected ETA; `MapCanvas.tsx` | Visual state matches available results |
| Fragile | QA controls exposed in release | `__DEV__` gate for controls and fixture URL parameters | Stress fixtures remain development-only |
| Fragile | Light outline had 1.62:1 contrast on white | Outline #7C8B82, 3.58:1; `tokens.ts` | Visible unselected control boundaries |
| Fragile | Tab lacked explicit focus styling | Reserved focus border; `(main)/_layout.tsx` | Focus does not depend on selected state |
| Fragile | Stress community source retained verified freshness | “Demo submission · Awaiting verification”; `mockRoutes.ts` | Unverified and verified states stay distinct |
| Broken | “Use manual origin” only cleared the permission message | Explicit origin picker request; `PlannerScreen.tsx` / `TripSearchBar.tsx` | Recovery now performs its named action; cancellation keeps the permission state |

Long place/reason/confidence text wraps without truncation. Metrics wrap as intact values. All controls have minimum 48dp targets; search dialog scrolls above the keyboard, Android Back dismisses the keyboard, manual place selection succeeds. Selection, confidence and route state use written labels as well as color. No authored animation, animated skeleton or native modal transition is used; reduced motion has equivalent static behavior.

Contrast calculation (sRGB WCAG): primary white/teal 6.94:1; muted text on white 6.36:1, raised 5.43:1 and selected 5.47:1; warning text on selected 5.96:1; alternate route/map 3.81:1. Map labels sit on solid backgrounds.

## Commands and reproduction

From root: `npm start` (localhost only). Reverse port with Android SDK ADB, open `exp://127.0.0.1:8081` in Expo Go. Normal planner defaults to all three cards. Dev controls at the end of the scroll surface include Demo data / Worst case and eight state previews. Fixture links accept `exp://127.0.0.1:8081/--/?demoState=unknown&collapsed=1`; `worstCase=1` enables long content and overlapping route lines. Android display configuration changes can restart Expo; reopen the fixture link once the app settles.

Required checks: `npm run lint`, `npm run typecheck`, `npm test`. Jest's Windows sandbox cache rename fails with EPERM; run the test command on the host in this environment. This is an environment limitation, not a skipped suite. Baseline Phase 1 was revalidated before implementation (3 mobile tests, 3 API tests, Ruff); Phase 2 suite has 14 passing tests.

QA uses native ADB screenshots and accessibility trees, not browser approximations. Transient boot/System UI ANR and pre-render blank captures are excluded from final evidence. No physical phone or iOS target was connected. Spoken TalkBack output has not been audited; roles, checked/selected state, complete card labels and map descriptions were checked in component tests and native UI trees.

The initial keyboard captures include Gboard's font-update notice. Clean final evidence is `keyboard-filter-final.png`: input, filtered Park Entrance choice and Cancel remain above the IME. `permission-picker-final.png` and `permission-recovered-final.png` show permission recovery opening the picker and applying the new origin. Final minimum-phone stress uses `stress-place-final.png`, `stress-map-final.png`, `stress-reasons-final.png`, and `stress-confidence-final.png`. Normal and widest comparison captures are `comparison-final.png`, `night-comparison-final.png`, and `wide-phone-final.png`.

## Acceptance record

Final review and completion status are recorded in `.harness/PLAN.md` and `.harness/TODOLIST.md`. Screenshot/XML pairs in this directory show the Planner and comparison, Community/Profile shells, degraded states, small-phone and large-text stress cases. Some stress captures show only part of an oversized card because the surface scrolls; the adjacent captures and native trees demonstrate full content reachability.

Final `npm run check`: lint, strict typecheck and 14 tests pass. Independent native finish review requested one functional permission-recovery correction; source, test and native screenshots confirm it resolved. Scoped verdict: **SHIP Phase 2 mock milestone**. Original emulator screen dimensions and font scale restored. No commit or push performed.

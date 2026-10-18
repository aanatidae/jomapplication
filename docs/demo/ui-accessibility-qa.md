# Jom! UI/accessibility QA — 2026-10-18

Phase 12 implementation and available-environment verification complete. Android Studio AVD API 37, Expo Go SDK 57. Normal 1080x2400/420dpi; stress override 640x1280/320dpi (320dp x 640dp), font_scale 2.0. Light portrait supported; dark/RTL not implemented. Tests are component/integration checks unless explicitly identified as native. No spoken TalkBack/VoiceOver, physical phone, release frame-rate or iOS claims.

## Findings before fixes

| Screen/flow | Severity | Reproduction / issue | Fix applied | Result |
| --- | --- | --- | --- | --- |
| Map selection | P1 | Alternate-route opacity .75 reduces line/map contrast to 2.57:1 | Raise opacity to .9 and darken alternateRoute to existing muted tone; retain numeric/textual selection | Final minimum 3.73:1 across all backgrounds; contrast.test.ts passes |
| Community/detail/reports/preferences retry | P1 | Fail initial read; press Retry on a pending promise: error/Retry stays visible, no busy feedback | Switch to loading immediately, remove retry until result | Fixed; regression tests pass |
| Expanded descriptions | P1 | Read full description has no expanded-state semantic | Expose accessibilityState.expanded | Fixed; regression tests pass |
| Field errors | P1 | Input label does not describe field-specific validation error | Attach error as accessibility hint, keep alert text | Fixed; regression tests pass |
| Auth/photo/content flag repeated press | P1 | Two same-turn events can pass React-state busy guard | Synchronous in-flight guard, release on failure | Fixed; regression tests pass |

## Existing boundaries

Schema title 100 chars; notes/report details 2000; one <=10MiB JPEG/PNG/WebP; six purposes/five accessibility/five warnings; route geometry bounded by DB validation. Planner accepts five named pilot nodes/three profiles; backend limits 1-3 options. Unknown timestamps/accessibility/evidence remain explicit. Existing dev-only StressScreen offers Demo/Worst/Empty/Failed save, and Planner offers degraded/worst fixtures; no fixtures publish to Supabase.


## Verification matrix

| Flow | Automated evidence | Native evidence in this task | Remaining limit |
| --- | --- | --- | --- |
| Onboarding/Profile | preferences.test.tsx, motion.test.tsx: save/retry/back/skip/restart, live Reduce Motion and query race | Normal and OS-disabled-animation onboarding; 320dp/200% long preference labels; actual Profile inspected without changing saved needs | No spoken screen-reader or physical-device run |
| Planner/search/profiles/comparison/details | plannerApi, routingApi, planner tests: real node request shape, alternatives, single option, no route/no Step-Free fallback, outside-network HTTP error, same endpoints demo, timeout/offline/retry, obsolete responses, selection roles | API-backed native profile switch, source-details modal, source/access uncertainty; 320dp/200% long-place/unknown fixture | Error/timeout scenarios are automated here; previous-phase native evidence is historical |
| Community/detail | community/flowStress/accessibilityQa: empty feed, 1000 rows with initial 20/Show more, long title, tags, full notes, broken image, retry loading | Real Supabase feed; isolated max-title/many-tags/2000-char detail and expanded prose at 320dp/200%; empty fixture | Supabase query remains bounded at 100; no infinite feed claimed |
| Share Route | community, motion, accessibilityQa, supabase tests: validation, contradictory tags, failed upload/publish cleanup, retained draft, one in-flight write, success only after storage | 100-character title/2000-char editor inspected; keyboard; isolated failed-save message and reachable retry at 320dp/200% | No new real photo post published in this task; real image permissions/policies covered by integration script |
| Barrier report/history | barriers, quality, accessibilityQa: category/location validation, temporary/permanent/unknown, expired/missing dates, exact expiry/mounted refresh, stale categories, duplicate/failed submit | Existing online report inspected; isolated 2000-character temporary form through review to Report submitted at 320dp/200%; keyboard visible | Permanent/expired/unknown states are automated; no live routing mutation |
| Authentication/preferences/Supabase | supabaseAuth/supabase tests plus actual verify-supabase.mjs: initializing, missing session/config, anonymous sign-in, session expiry, unauthorized writes, image upload failure, read failure/retry | Existing restored identity loads live feed/preferences; real public-key integration verifies two guest identities and session restore | No destructive reset/sign-out of existing user identity |
| Reduced Motion/interaction | motion tests verify live event, initial-query race, state feedback/commit unaffected, success timing; plannerApi verifies rapid switches | Android Remove animations enabled; onboarding progression usable, restored original setting | No iOS, release performance/FPS/memory or physical haptic sensation measured |

## Stress fixture and layout observations

Dev-only `/stress?surface=onboarding|community|detail|share|barrier` retains Demo data/Worst case/Empty/Failed save controls. Worst data uses schema-backed 100-char title and 2000-char descriptions, many valid tags, accented author, CJK/short title, missing/broken photos and old/missing dates. Fixture repositories are isolated in-memory/local; never upload these rows to Supabase. Planner fixture params remain dev-only.

At 320dp/font scale 2, the existing tab bar stacks; content scrolls rather than shrinking labels. All actions checked remain reachable by scrolling. The multiline editor scrolls internally; to move the outer form, swipe outside the editor. QA helper was corrected to target the visible gutter from actual UI-tree bounds. Earlier failed helper searches were not application crashes. Screenshot names containing `final`, `barrier-keyboard`, `onboarding-worst-small`, `profile-small`, and the final Planner/empty captures are the meaningful evidence. `barrier-review-small`/`barrier-submitted-small` captured a helper failure still on details; use `barrier-review-final`/`barrier-success-final` instead. Initial `share-keyboard` includes a system Gboard font-size tutorial; `barrier-keyboard` shows the editor and actual keyboard clearly.

Titles, warnings, sources and route explanations wrap. Long descriptions have an accessible Read full description/Show less control. Essential route facts exist in labelled cards and source detail outside the map. Choices/radio/tab selection remains textual and semantic. All reusable controls retain 48dp minimum targets and focus borders. Photo removal also retains its full target.

## Contrast

Computed sRGB ratios: ink/background 12.97:1; muted/background 5.81:1; muted/white 6.36:1; white/accent 6.94:1; warning/white 6.93:1; disabled text/background 4.88:1; outline/white 3.58:1. Alternate route at .9 opacity uses #52635D: map 4.31, park 3.73, block 3.95, water 3.85, road 5.01. contrast.test.ts guards 4.5:1 text and 3:1 selected/alternate routes on every surface. Labels and numbered options provide non-color information. Light-only application; dark/RTL not claimed.

## Quality gates and limitations

Final `npm run check`: Expo lint and strict TypeScript pass, 97 tests across 15 suites pass. API Ruff and 121 Pytests pass (existing Starlette/httpx deprecation warning only). Android Hermes production export passes. Clean npm ci passed with 1076 packages; every baseline dependency record preserved plus expo-haptics 57.0.3. git diff --check passes.

Real `node --env-file=apps/mobile/.env.local scripts/verify-supabase.mjs` passes A/B ownership, private profiles, public reads, verified insertion/update rejection, 24-hour expiry, session restore, preferences, route/report image access, cross-user overwrite/delete rejection and MIME policy. Disposable rows/images removed; anonymous auth identities require administrator cleanup, as already documented for this script. No migrations, RLS weakening or service-role credential used.

No known unresolved P0 or significant P1 found within this source/test/emulator scope. Physical Android, iOS, spoken TalkBack/VoiceOver and release-build slow-device feel/performance remain unverified. Existing Phase 0 geographic provider rendering and previous dependency advisories are unchanged; app uses its explicitly labelled schematic. Native screenshots do not prove spoken reading order or frame rate. No turn-by-turn navigation exists. Phase 13/14 work not started.


Final native diagnostics: the crash buffer contains two `uiautomator` UiAutomationService-already-registered/Bad-file-descriptor failures from earlier concurrent helper requests, not an Expo/Jom stack. Evidence retained in phase12/automation-crash-buffer.txt. Final helper operations were serialized and completed. The Phase 11 empty-buffer observation refers to its earlier checkpoint. Original settings verified after reset; final app route is the real API-backed Planner.

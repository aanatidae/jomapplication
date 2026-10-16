# Phases 6–8 verification — 16 October 2026

Scope: onboarding/preferences, local community sharing, local barrier reporting, in that order. No Supabase/auth/cloud upload/RLS/moderation or final animation phase. Git was clean at intake; no unrelated work was present or overwritten. No commit or push performed.

## Phase 6

Three steps: welcome, walking preferences/detour, mobility needs. Back and skip retain the applicable draft. Successful saves persist completion before entering the app. Launch read errors offer Retry; save errors retain edits. Profile reuses PreferenceFields, supports edit/reset-draft/save, and exposes a development-only restart option. No age, demographic, identity or IC-number field.

Central UserRoutePreferences model and explicit API mapper. Versioned AsyncStorage key `jom.preferences.v1`; no global state library. Completion and preferences survive Expo Go force-stop/relaunch (restart-check/restart-profile captures). Planner cache keys include supported preferences and obsolete requests remain cancelled/suppressed.

Active server preferences: prefer_well_lit and prefer_public_areas add exposure-weighted costs; avoid_stairs excludes stairs and unknown stairs; avoid_steep_slopes excludes unknown or absolute slope above the existing demo 8.33% threshold; max_detour_minutes caps extra time against the unconstrained fastest route. Existing profile constraints remain stronger where applicable. No preferences preserves the original 8/10/12-minute profile results. Avoid stairs + lighting selects the 10-minute, no-stairs alternative in the native planner. Unknown accessibility remains explicit.

Covered/shaded paths and ramps/elevators are stored and visibly labelled saved-only. No isolated-path field without a supported data attribute. Custom deferred to preserve the three public profile contracts; needs already apply across the required profiles. No client scoring.

## Phase 7

Community feed, reusable route cards, detail with schematic geometry, structured sharing, success state and local content flag. Share from a selected planner route or choose a labelled seeded demo route. Title max 100; notes max 2,000; purpose required; accessibility contradictions rejected; warnings, optional valid last-walked date, optional single local photo. Newly created routes appear in the feed after durable save.

CommunityRoute: id, author, title, notes, purposeTags, SharedPath snapshot (geometry, origin/destination, distance, duration, coordinate system), accessibilityTags, routeWarnings, photos, lastWalkedAt, createdAt, verificationLevel. Unused confirmation counts omitted. New content always overrides any caller-supplied verification/author with community_submitted/local contributor. No fake counts. Bookmark/confirm actions deferred. Report-content creates a real local flag with a clear disclosure that no moderation service is connected.

CommunityRouteRepository exposes list/get/create; local implementation wraps serialized versioned AsyncStorage collection `jom.community.v1`. Screens receive the repository interface. Phase 9 can replace the service implementation. Only an explicit sharing action holds a selected route in memory; no background route history.

Image picker: Expo ImagePicker 57.0.20, image-only system picker; one local URI, 10 MB metadata limit. No broad photo permission request, camera, audio or cloud upload. Existing image remains on cancellation; denied access/errors provide recovery and allow continuing without a photo. Local references may disappear after cache/storage clearing, disclosed in UI; failed images have readable fallbacks. Android picker opens, selects the disposable app-icon test image, and returns to the form with Change photo. Cancellation/denial/invalid-type/fallback behavior covered by component tests; no physical-device photo claim.

## Phase 8

Planner Report Barrier and Local reports actions; four steps: category → route point/location → description/duration/photo → review/submit. All stable categories: blocked_walkway, lift_unavailable, missing_ramp, construction, poor_lighting, flooded_path, unsafe_crossing, incorrect_map.

BarrierReport: id, category, location, description, optional photoUri, reportedAt, conditionType, verificationLevel, optional expiresAt. Location stores labelled schematic point, coordinate system, optional selected route ID and waypoint index. Backend does not expose real segment IDs or geographic coordinates; none fabricated. Current-route entry prefills point 1 and permits selecting another vertex. Without a route/GPS, user explicitly selects Transit Stop deterministic demo location.

BarrierReportRepository exposes list/create; local implementation uses `jom.barriers.v1` behind the same serialized storage boundary. Reports always start community_submitted. Successful report is inspectable immediately and in the local list. Failed save retains review/draft and offers retry. Temporary/permanent/unknown preserved. Temporary conditions receive a configurable 24-hour expiry/reconfirmation deadline; expired items stay inspectable and show reconfirmation status. They never automatically block or alter routing.

## Automated checks

Executed from project root, with the final source and minimal lockfile:

```powershell
npm ci --no-audit --prefer-offline
npm run check
./.venv/Scripts/python.exe -m ruff check services/api
./.venv/Scripts/python.exe -m pytest services/api/tests
npm exec --workspace mobile -- expo export --platform android --output-dir ../../.local/phase678-export
Invoke-RestMethod http://127.0.0.1:8000/health
```

Results: clean install succeeds (1065 packages); mobile lint PASS; strict typecheck PASS; 65 mobile tests across 9 suites PASS; Ruff PASS; 119 backend tests PASS; health 200/status ok; Android Hermes production bundle PASS. Preserved Starlette/httpx deprecation warning is non-fatal. Root npm workspace commands supersede old pnpm examples. Windows host execution avoids the documented sandbox Jest cache/TestClient limitations. Final dependency changes are only five added mobile entries; all baseline versions and locations are preserved, and no temporary root React-type dependency remains.

## Native manual sequence

Android Studio Medium_Phone_API_37.0, emulator-5554, Expo Go SDK 57, loopback API 8000 and Metro 8082 through ADB reverse.

1. First-run welcome → walking preferences (well-lit) → mobility (avoid stairs) → Finish.
2. Profile shows both saved selections; force-stop/relaunch skips onboarding and retains them.
3. Planner calls the real API, displays 10-minute no-stairs geometry, server reasons and unknown-data warnings. Tests inspect the exact supported preference request body.
4. Community seeded feed → detail/map → Share Route: Covered mall shortcut, Shortcut purpose, notes, Ramp available → success → feed labelled Community submitted.
5. Planner → Report Barrier → blocked walkway → route point 2 → description → Temporary → review → submit → success → Local reports with timestamp, Community submitted and reconfirmation deadline.
6. Native photo picker opened and selected local demo image. Optional/no-photo paths also exercised.

No source/data editing is needed to perform these flows. Dev reset: Profile → Restart onboarding demo clears only preferences/completion. Other local demo records remain. Community and report data stay on this device; uninstall/clearing app storage removes them.

## break-ui findings and fixes

| Severity | Field / value | Before | After / location |
| --- | --- | --- | --- |
| Broken | 2,000-character notes at 320dp / 200% text | Multiline input expanded across the viewport and absorbed scrolling toward later actions | Bounded editable viewport, internal text scroll, outer page scroll; components/Forms.tsx |
| Fragile | 100-character route title | Card action repeated the full title and became needlessly tall | Full title retained; concise View route action with title accessibility hint; community/components.tsx |
| Fragile | Long description in review/detail | Submission/metadata buried beneath full prose | Four-line expandable summary with Read full description; components/ExpandableText.tsx |
| Fragile | Large local feed | Rendered all records in one scroll view | 20 entries initially, Show more; 1,000-row regression case; CommunityScreen/ReportsScreen |
| Broken during intake | First-run safe area / require cycle | Content met status bar and Expo warning obscured UI | Safe wrapper and separate preferences/context.ts |
| Fragile | New Planner actions | Sharing/reporting actions displaced route-priority controls below the initial viewport | Restored priorities directly below the map, with secondary actions afterward; PlannerScreen.tsx |
| Tooling | Large QA controls at 200% text | Preview chrome consumed most of viewport | Compact non-scaling dev-only toolbar; product text retains scaling |

Native stress evidence includes onboarding-long-labels, onboarding-mobility-small, share-notes-keyboard-small, share-worst-fixed-success, barrier-no-location-small, barrier-long-description-small, barrier-review-worst-small, barrier-success-worst-small. Small setting: 840×1680 pixels at density 420 = 320×640 dp; font_scale 2.0. Original 1080×2400, density 420, font_scale 1.0 restored. Native normal and worst states inspected, with scrolling actions exercised. Test fixtures also cover empty/1,000 feeds, many tags, absent photos/author avatars, invalid image URI, no location, permanent/unknown duration, failed local save and retry. Multiple photos intentionally unsupported (one-photo maximum). Onboarding has no keyboard fields. App is portrait/light-only; landscape/dark/RTL are not claimed supported. Physical phone/iOS/spoken TalkBack remain untested.

Development previews: Profile → Development previews → Stress test onboarding/community/detail/share/barrier. Demo data / Worst case / Empty / Failed save use the same screens and injected isolated repositories. Preview saves never overwrite real demo records. Release hides these controls and blocks the preview route. Preview success navigation to the normal feed/detail intentionally returns to normal stored data, not isolated QA records.

## Skills

Reviewed mobile-native, impeccable, ui-skills-root, emil-design-eng, apple-design, prototype and pick-ui-library against the established Phase 2 system. Used their native interaction, typography, Operate-mode and reuse guidance; did not create another visual language or pause for a variant selection. Applied break-ui with its catalog, data-boundary fixtures and preauthorized fixes. ui-skills selected Callstack React Native guidance. Android-emulator-qa and React best-practices review used for validation. Impeccable launcher failed cache_directory_failed; existing PRODUCT/DESIGN and craft-floor/Operate/new-work references read directly. No authored motion added.

## Remaining limits

Simulated schematic pilot only, not geographic guidance. No real-time conditions or automatic route effects from unverified community data. Photos are local references, not durable uploads. Optional Custom/isolated-path routing, bookmark and confirmation actions deferred. Phase 9 remains entirely unchecked. Original dependency audit findings and geographic-map-provider work remain separate earlier-project limitations.

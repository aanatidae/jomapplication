# Phase 11 motion review — 2026-10-18

Skills applied: animation-vocabulary, animate-expo (+ press/step recipes), animate, find-animation-opportunities, improve-animations quick audit (AUDIT.md), review-animations (STANDARDS.md), Emil design engineering and Apple design. Web/CSS recipes translated to existing Reanimated 4.5.1; no web motion runtime. Review is source/native emulator scope, not physical-device feel approval.

## Opportunities and gates

| Location | Previous behavior | Purpose / frequency | Chosen implementation |
| --- | --- | --- | --- |
| Buttons, Choice, RouteProfileChip, RouteOptionCard | Immediate opacity only | Feedback; tens/day | UI-runtime CSS transform transition 1 → .97, 120ms press / 100ms release, cubicBezier(.23,1,.32,1). Existing opacity remains immediate. |
| Onboarding and ReportScreen steps | Entire form swaps instantly | State indication; occasional | 180ms ease-out, opacity .8 → 1, translateY 8 → 0; progress and title update immediately. |
| Share/report completion | Text after confirmed repository write | Completion feedback; rare | Same restrained entrance and one native success haptic after successful persistence. |
| Map segment selection | Instant thickness/color emphasis | State indication; tens/day | Only opacity .9 → 1 transitions over 120ms. Geometry, width and color update immediately. |

Rejected: animated route drawing (functional information; could imply calculated results before response); viewport movement (schematic has no geographic camera); bouncing cards/staggered feeds (frequency and readability); animated text heights/dragging comparison (existing in-flow scroll surface, large-text and gesture stability). Collapse/expand retains a labelled 48dp action with press feedback, no custom drag recognizer. Tabs and keyboard/picker remain immediate. Bookmark/confirmation are not implemented and were not invented.

## Review findings and resolution

| Before | After | Why |
| --- | --- | --- |
| Skill CSS easing string on native Reanimated | cubicBezier(...theme.motion.easeOut) | Native runtime rejected CSS string; corrected and reloaded on Android. |
| Proposed entrance on every FormPage | Explicit animateStep on onboarding/report steps and completed submissions only | Peer tabs must not slide; reading and frequently entered screens remain stable. |
| Separate ad-hoc timings | Central theme.motion values | Cohesion, no drift. |
| Potential late OS query overwrites Reduce Motion event | Event takes precedence over initial query | Newer preference wins; regression test. |

Contrast audit raised alternate-route opacity from .75 (2.57:1 on map) to .9 (3.24:1); stable segment keys preserve transitions when drawing order changes.

No remaining source-level motion blocks: only transform/opacity animate; no per-frame JS state, looping effects, geometry interpolation, artificial wait or input lock. Reduce Motion starts conservatively enabled, then follows OS query/events; press scale and step translation disappear and textual selection/progress/errors remain. Subscriptions clean up. Android uses View.performHapticFeedback through Expo Haptics (system settings respected); iOS uses native selection/notification APIs. Unsupported feedback promises are swallowed; visual persistence results remain authoritative.

Native evidence: phase11/native-loaded, step-free, reduced-onboarding, reduced-preferences, barrier-location PNG/XML. Android crash buffer empty at check. Real-device tactile timing, release-build slow-device profiling, iOS and measured FPS/memory are not verified. No claim of 60fps or physical haptic sensation.

Verdict: approve code and available Android functional verification; physical release feel/performance acceptance remains an explicit limitation.

Phase 12 extended the contrast fix across park/block/water surfaces: alternateRoute now uses existing muted tone #52635D, minimum 3.73:1 at .9 opacity. Relevant code: src/features/motion/Motion.tsx:27, src/features/planner/MapCanvas.tsx:14, src/components/Forms.tsx:9.

# Navigation design review — 2026-10-21

**Verdict: approve at the reviewed fix-list scope.** This is an Operate surface extending Jom!'s established teal, warm-neutral and system-type identity. The independent finish review's two material findings are resolved: map recovery no longer sits beneath the comparison panel, and extreme text scaling retains complete navigation-tab labels. This records native review evidence; it is not a production-readiness certification.

## Evidence checked

- Read `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, central tokens, `direction.md`, current `PlannerScreen`, `NavigationPanels`, `LeafletMap`, `leafletDocument`, shared motion and the navigation QA fixture. Functional test and emulator execution details remain in [results.md](results.md).
- Visually inspected [reviewed-active-large.png](reviewed-active-large.png) and [reviewed-preview-large.png](reviewed-preview-large.png): Stop/Start remain visible at the recorded 320 dp / 200% font configuration, full Planner/Community/Profile labels stack, and details occupy bounded scroll regions. The screenshots show only the current scroll position; scrollability is also checked in source, not inferred from a still image.
- Visually inspected [map-failure-confirmed.png](map-failure-confirmed.png): explicit tile-error copy and Retry map occupy the map space above the comparison panel. `LeafletMap.tsx:63` uses measured panel insets and a scrollable recovery region.
- These PNGs are Android Emulator captures, not generated artwork. No new shipping raster artwork was created. No HTML/CSS detector was run for this native React Native surface; the embedded Leaflet document was inspected as its own map/motion boundary.

## Meaningful skill application

The implementation record documents mobile-native, Impeccable, ui-skills-root/Callstack, emil-design-eng, apple-design, pick-ui-library and prototype application. Their relevant outcome is concrete: keep native primitives and existing tokens, make the map primary, preserve one-handed Start/Stop, bound overlays, wrap or scroll long content, and expose uncertainty in text. The explicit familiar navigation brief fixed the surface direction; isolated working/stress fixtures supplied prototype comparison without replacing the identity.

Break-ui is represented by the development-only `/spikes/navigation-qa` route: Demo data / Worst case / GPS unavailable / Recalculating / Arrived. It feeds the ordinary guidance/progress components a long plausible Brickfields destination, 1,999 m / 1,999 s and a long missing-accessibility error. Destination and error strings have no local fixture-enforced length limit. [worst-case-large.png](worst-case-large.png) and the recorded small-phone/large-text run are the stress evidence. Existing planner degraded-state fixtures cover other demo states; this review does not claim every catalog case or every app screen was retested.

| Before | After | Why |
| --- | --- | --- |
| Failed-map recovery could be covered by the bottom panel. | Inset-aware scrollable recovery keeps Retry in the visible map space (`LeafletMap.tsx:63`). | A failure must leave an actionable recovery path. |
| Compact navigation treatment lost complete labels at 320 dp / 200% text. | Established stacked tabs restored; both reviewed large-text captures show full labels. | Preserve readable destinations and selection at the supported stress size. |
| Small-phone/large-text profile and map controls compressed or overlapped. | Nonshrinking text-sized horizontal profile strip, shorter Locate/Following labels with full accessibility names, bounded scroll regions and fixed Start/Stop (`PlannerScreen.tsx:74`, `:98`, `:104`; `NavigationPanels.tsx:31`). | Protect the principal action while retaining access to comparison and guidance details. |
| Historical schematic snapshot had no location-follow motion to communicate. | Puck transform uses 250 ms `cubic-bezier(0.23,1,0.32,1)`; follow camera is capped at 0.25 s (`leafletDocument.ts:63`, `:66`). | Brief positional continuity helps connect accepted GPS updates without delaying state commits. |
| A moving map could compete with manual exploration or Reduce Motion. | Touch stops camera motion; drag/wheel/manual zoom relinquish following. OS preference disables puck transition and camera animation; static route fit is immediate (`leafletDocument.ts:25`, `:35–39`, `:66`). | Movement remains interruptible and optional. |

## Motion verdict

Applied animation-vocabulary, animate-expo, animate, find-animation-opportunities, improve-animations and review-animations at the navigation seam, as recorded in `results.md`; independently checked the current code above. Existing shared press feedback retains asymmetric 120 ms press / 100 ms release, scale 0.97 and the established ease-out curve (`Motion.tsx:20–28`). Reduce Motion defaults to enabled until the OS preference resolves (`Motion.tsx:7–17`). Navigation adds no entrance choreography, animated ETA digits, route-line drawing or looping reroute pulse. Route/progress state does not await an animation.

**Approve for scoped motion behavior.** No blocking motion regression was identified in source and the supplied emulator evidence. The camera uses Leaflet's camera animation; the stated cubic curve applies to the puck, not to a custom camera interpolator. Still screenshots do not verify frame pacing, physical feel or haptics, and no release-performance claim is made.

## Historical drift retained

`DESIGN.md` and its sidecar remain the Phase 2 snapshot, with a dated navigation-extension note added under Components. Their older schematic-only flow, no-authored-motion description and sheet-only elevation wording do not describe every current consumer. The documented `alternateRoute` value is `#6A7974`, while current central tokens use `#52635D`; shared tokens already contain press/release/step motion settings absent from that historical sidecar. `PRODUCT.md` also describes the original mock scope. These are reported, not repaired or used to redefine this extension.

This documentation pass changes no visual tokens, normative frontmatter or `.impeccable/design.json`; navigation reuses the existing system and requires no new token or sidecar entry. A broader historical refresh is separate work.

No physical outdoor device, iOS, spoken screen-reader or release-performance testing was performed for this review. Foreground route following is the reviewed behavior; turn-by-turn/voice directions, continuous background tracking and substantiated Night/Step-Free coverage are not established by these captures.

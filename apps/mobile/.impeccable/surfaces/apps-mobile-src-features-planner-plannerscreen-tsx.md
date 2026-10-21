---
version: 1
slug: "apps-mobile-src-features-planner-plannerscreen-tsx"
primary_target: "apps/mobile/src/features/planner/PlannerScreen.tsx"
related_targets: ["apps/mobile/src/features/navigation/NavigationPanels.tsx","apps/mobile/src/features/planner/LeafletMap.tsx"]
---

# Navigation surface direction

Mode: Operate. Android phone first. This extends Jom!'s established identity; no new visual world or design tournament is required by the explicit user brief.

## Direction contract

THESIS: A real map carries destination selection, preview, Start, walking progress and arrival. Walking is the task; GPS and backend results determine state.

OWN-WORLD: Keep the existing teal #006653, warm neutral, native system type, 48 dp controls and solid comparison surfaces. Safety and accessibility uncertainty remains textual.

STORY: Select a destination and origin, choose a profile and alternative, press Start, follow actual foreground GPS. Pan to explore, Recenter to follow, Stop to clean up. No fabricated turns or movement.

FIRST VIEWPORT: Map fills the Planner; compact search sits at the top. Profiles and scrollable comparison sit in a bounded bottom sheet. Start stays outside the scroll. Active mode replaces search/comparison with guidance, remaining distance/ETA and fixed Stop. Camera accounts for panel insets.

FORM: Existing brand extension, code-led implementation, user-pinned familiar navigation flow. No seed key: no identity replacement or open concept selection occurred.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance. Screenshots here are emulator evidence, no new raster artwork ships.

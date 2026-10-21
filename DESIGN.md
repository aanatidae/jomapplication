---
name: Jom! Phase 2
description: Native Android walking-route comparison mock
colors:
  background: "#F5F5EF"
  surface: "#FFFFFF"
  raised: "#EBEEE7"
  ink: "#172F2C"
  muted: "#52635D"
  accent: "#006653"
  onAccent: "#FFFFFF"
  selected: "#E4F1E9"
  outline: "#7C8B82"
  focus: "#163FAD"
  safety: "#685016"
  safetySurface: "#FAF0CE"
  accessibility: "#234D78"
  accessibilitySurface: "#E8EFF8"
  verified: "#006653"
  success: "#21633D"
  warning: "#795215"
  error: "#A02C2C"
  errorSurface: "#FBEDEC"
  disabled: "#E2E6DF"
  onDisabled: "#59645D"
  map: "#E8ECE2"
  park: "#CFDDC4"
  block: "#DCE1D6"
  road: "#FFFFFF"
  alternateRoute: "#6A7974"
  routeHalo: "#FFFFFF"
  water: "#CFDFE4"
typography:
  display: { fontSize: "32sp", fontWeight: 700, lineHeight: "38sp", letterSpacing: "-0.8sp" }
  heading: { fontSize: "24sp", fontWeight: 700, lineHeight: "30sp", letterSpacing: "-0.4sp" }
  title: { fontSize: "18sp", fontWeight: 600, lineHeight: "24sp" }
  body: { fontSize: "16sp", lineHeight: "23sp" }
  caption: { fontSize: "14sp", lineHeight: "20sp" }
  label: { fontSize: "14sp", fontWeight: 600, lineHeight: "20sp" }
rounded:
  sm: "8dp"
  md: "12dp"
  lg: "16dp"
  sheet: "24dp"
  pill: "999dp"
spacing:
  xxs: "4dp"
  xs: "8dp"
  sm: "12dp"
  md: "16dp"
  lg: "24dp"
  xl: "32dp"
  xxl: "48dp"
components:
  button-primary: { backgroundColor: "{colors.accent}", textColor: "{colors.onAccent}", rounded: "{rounded.md}", padding: "12dp 16dp" }
  button-secondary: { backgroundColor: "{colors.raised}", textColor: "{colors.ink}", rounded: "{rounded.md}", padding: "12dp 16dp" }
  route-card: { backgroundColor: "{colors.surface}", rounded: "{rounded.lg}", padding: "16dp" }
  route-card-selected: { backgroundColor: "{colors.selected}", rounded: "{rounded.lg}", padding: "16dp" }
  comparison-sheet: { backgroundColor: "{colors.surface}", padding: "16dp" }
---

# Design System: Jom! Phase 2

## Overview

Current implementation snapshot for the native Android, Expo SDK 57 mock planner. The execution authority remains `.harness/AGENTS.md`, `.harness/PLAN.md`, and `.harness/TODOLIST.md`; this document records the system in `apps/mobile/src/theme/tokens.ts` and its consumers. It does not establish a separate roadmap or certify QA.

The map-first flow uses solid surfaces, system typography, a deep teal accent, explicit selection labels, and plain-language route trade-offs. Light only; dark theme and RTL support are not established. Native visual and accessibility acceptance is tracked separately in the harness.

## Colors

Deep teal `accent` marks primary actions and selected controls. `selected` gives route cards and tabs a pale tonal backing. `ink` and `muted` provide primary and secondary text on warm neutral `background` and white `surface`; `outline` separates controls. `raised` backs secondary buttons and reason badges. `focus` marks keyboard focus on buttons, route chips, route cards, and navigation tabs.

Safety, accessibility, verification, success, warning, and error tokens describe distinct semantic roles. Some are reserved tokens rather than active treatments on every screen. Reason badges currently use the neutral raised surface; confidence text uses teal verified color for checked demo data and warning color for community or unknown data, always with a written prefix. Map tokens belong to the illustrative schematic. Never infer a real-world safety or accessibility guarantee from a color.

## Typography

React Native Text uses the platform system font; no custom font family is loaded. Preserve system text scaling. Frontmatter uses sp to describe scalable native text and dp for layout; these are documentation units for React Native numeric styles, not browser CSS units. Body and caption inherit the native default weight. All text uses ink unless overridden; captions use muted. Buttons use body sizing with weight 600. Labels remain sentence case. There is no enforced modular scale or web line-length rule.

## Layout

The planner is one scrollable column, centered with a 720dp maximum width. Header and trip search precede the schematic map and comparison surface. Main content padding is 16dp; general shell padding is 24dp. Control targets are at least 48dp; labels wrap and grow rather than receiving fixed heights. Chips, metrics, and route reasons wrap.

Map height tokens are 320dp and compact 260dp. The planner requests compact mode above font scale 1.5. Legend and demo footer remain in normal flow outside the geometry canvas; A/B markers scale from 32dp by max(1, fontScale). Main navigation stacks when window width divided by font scale is below 180; there are no CSS breakpoints. Safe areas and the place-picker keyboard avoidance use native components.

## Elevation & Depth

Solid backgrounds, borders, and selected tones carry most hierarchy. The comparison surface alone uses the sheet elevation token: native shadow color ink, offset (0, -3), opacity 0.08, radius 12, Android elevation 3. This is not a general floating-card shadow.

## Shapes

Controls use 12dp corners; route cards 16dp; reason badges 8dp. The comparison surface rounds only its top corners to 24dp. The navigation indicator uses the pill radius. Interactive button/chip/card borders are 2dp; navigation uses a 1dp top divider. Icon sizing tokens are 16/24/32dp; the cancel button's geometric cross is 24dp and always has a text label.

## Components

- **Buttons:** primary teal/white and secondary raised/ink; 12dp vertical and 16dp horizontal padding, 48dp minimum height and width. Press opacity 0.7; focused border uses focus; disabled uses disabled/onDisabled. No authored hover animation.
- **RouteProfileChip:** radio semantics, 48dp minimum height, 12dp padding, 2dp outline; selected teal with white text and a visible “Selected” prefix. Focus border and press opacity match buttons.
- **RouteOptionCard:** 16dp padding, 8dp content gaps, 2dp outline; selected teal border/pale selected fill. ETA leads distance and detour; reasons wrap; confidence and freshness remain textual. Radio accessibility label includes the route's facts.
- **RouteComparisonSheet:** scrollable comparison content in the parent flow, with explicit expand/collapse control. Selected card appears first. No drag gesture or animated sheet behavior is implemented.
- **TripSearchBar:** two labelled buttons open a native modal listing four local demo places. Search input has a 2dp accent border, white fill, 12dp corners/padding, and 48dp minimum height. This is local filtering, not live geocoding.
- **Navigation:** Planner, Community, Profile; active pale backing and teal indicator, pressed raised backing. Labels use label typography; a 2dp focus border uses the focus token; accessibility exposes tab selection.
- **PlannerState / badges:** loading, empty, error, permission, map-unavailable, and unknown-data presentations are local demo states. Missing accessibility remains explicitly unknown. No looping skeleton or authored movement is used; duration token is zero and picker animation is none.

Development fixture URLs accept `demoState=loading|empty|mapUnavailable|permissionDenied|dataUnavailable|unknown|error`, `worstCase=1`, and `collapsed=1`. Release ignores these parameters and hides demo controls; these fixtures simulate states rather than exercising live services.

### Navigation extension — 2026-10-21

The Phase 2 snapshot above remains historical. The current geographic Planner extends its teal, warm-neutral, system-type identity: a full map sits behind compact search and bounded, scrollable comparison/guidance surfaces. Start and Stop remain outside scrolling details. At large text sizes, profile choices scroll horizontally inside the comparison region; primary navigation stacks to retain complete labels. Map-error recovery occupies the inset-adjusted map space so Retry remains reachable.

Foreground navigation shows actual location, accuracy, remaining geometry and textual uncertainty. Guidance explicitly states that turn-by-turn instructions are unavailable. Pan/zoom relinquishes following; Recenter restores it. Location-puck movement and follow-camera transitions are bounded to 250 ms, interruptible, and disabled by the OS Reduce Motion preference. Route/profile changes and progress text commit immediately; no decorative route drawing or animated metrics are added. Existing colors, typography, radii and shared tokens are reused. Native review evidence and historical documentation drift are recorded in `docs/navigation/design-review.md`; this extension does not certify physical-device or iOS acceptance.

## Do's and Don'ts

- Do reuse central tokens, preserve native text scaling, and provide textual selection/status cues.
- Do label schematic geography, fixed ETAs, and simulated confidence as demo information.
- Do preserve 48dp targets, wrapping content, and access to all comparison content by scrolling.
- Don't present community submissions as verified or missing accessibility as accessible.
- Don't add decorative motion, glass effects, gradients, or unexplained safety claims to this Phase 2 system.
- Don't treat this documentation or a successful export as evidence that native QA passed.

# AGENTS.md

## Project overview

Jom! is a pedestrian-first smart route planner for the Sime Darby Property University Hackathon 2026. The product must help people choose a walking route based on more than distance alone. The core route decision should combine estimated walking time with environmental safety indicators, accessibility, time of day, current route conditions, and explicit user preferences.

The MVP must prove one user-visible claim:

> Given the same origin and destination, Jom! can generate different, explainable walking routes for different user needs.

The minimum route profiles are:

- **Fastest** — prioritises walking time while avoiding known closed or unusable segments.
- **Safer at Night** — increases the weight of lighting, active/public frontage, safe crossings, and verified staffed security/public facilities.
- **Step-Free / Wheelchair Accessible** — excludes stairs and known inaccessible barriers and prefers ramps, curb cuts, elevators, manageable slopes, and accessible entrances.

Community features should let users share useful walking routes and report barriers such as poor lighting, blocked paths, lift outages, construction, flooded paths, unsafe crossings, and missing ramps.

The product is supported by a 168-response validation survey. The important product implications are:

- Users value shortest time, but also sidewalks, crossings, lighting, shade, and current route conditions.
- Many respondents were willing to take a longer route for better lighting and more active/public surroundings.
- Accessibility and temporary route-condition information have broad value, including for injuries, luggage, strollers, older users, and wheelchair users.
- Community-contributed route information is useful, but must not be treated as verified by default.

## Source of truth

Before making product decisions, read these files in this order:

1. `AGENTS.md`
2. `PLAN.md`
3. `TODOLIST.md`
4. Any project documentation in `docs/`, especially the Jom! project documentation or survey exports if present.
5. The relevant installed design/engineering skill files listed below.

If implementation discoveries conflict with the plan, do not silently diverge. Update `PLAN.md` under `Decision Log`, update `Progress`, and then update `TODOLIST.md`.

## ExecPlan rule

`PLAN.md` is the living execution plan for this project. For any complex feature, multi-file change, architecture change, or significant refactor:

- Read the complete `PLAN.md` before starting.
- Continue to the next milestone without asking the user for routine “next steps”.
- Keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current.
- Record important decisions and the reason for them.
- Keep the plan self-contained enough that another agent could resume from it.
- Update `TODOLIST.md` only when acceptance criteria are actually satisfied.

Do not mark a task complete because code was generated. Mark it complete only after the relevant test, build, or user-visible behavior has been verified.

## Required use of installed skills

The following skills are already installed under `~/.agents/skills/`. Skills are instructions and review frameworks, not runtime dependencies. Read the corresponding `SKILL.md` before doing the kind of work listed below.

### Required for the first major mobile UI/design pass

Read all of these before establishing the visual system or building production screens:

- `~/.agents/skills/mobile-native/SKILL.md`
- `~/.agents/skills/impeccable/SKILL.md`
- `~/.agents/skills/ui-skills-root/SKILL.md`
- `~/.agents/skills/emil-design-eng/SKILL.md`
- `~/.agents/skills/apple-design/SKILL.md`
- `~/.agents/skills/pick-ui-library/SKILL.md`
- `~/.agents/skills/prototype/SKILL.md`

Use them to decide layout, typography, component hierarchy, native interaction patterns, map overlays, bottom sheets, route cards, touch targets, accessibility, and the overall visual language.

`apple-design` is a reference for polished mobile interaction patterns. Do not turn Jom! into an Apple clone and do not sacrifice Android conventions.

### Required for motion and interaction polish

Before adding non-trivial animation, read:

- `~/.agents/skills/animation-vocabulary/SKILL.md`
- `~/.agents/skills/animate-expo/SKILL.md`
- `~/.agents/skills/animate/SKILL.md`

After the primary flows work, use:

- `~/.agents/skills/find-animation-opportunities/SKILL.md`
- `~/.agents/skills/improve-animations/SKILL.md`
- `~/.agents/skills/review-animations/SKILL.md`

Animations must communicate state, spatial relationships, or hierarchy. Avoid decorative motion that slows route planning. Respect the operating system's Reduce Motion setting.

### Required for UI stress testing

Before considering a major screen complete, read and apply:

- `~/.agents/skills/break-ui/SKILL.md`

Test at minimum:

- long place names
- large font sizes
- small phones
- empty states
- permission denied
- no route found
- API timeout
- missing accessibility data
- many route reasons
- long community-post descriptions
- keyboard open
- low contrast conditions on the map

### Conditional skills

Use these only when relevant:

- `web-design-guidelines` — for a web admin/operator dashboard or web landing surface.
- `ask-sonner` — only if a web surface uses Sonner-style toast interactions.
- `write-swift` — only if a native Swift module is genuinely required.
- `review-animations` — always use before final motion sign-off, but not before there are animations to review.

Do not invoke every installed skill mechanically. Use the right skill for the task and document meaningful design decisions in `PLAN.md`.

## Design direction

Jom! should feel like a trustworthy, modern mobility product rather than a generic hackathon dashboard.

Design for fast comprehension while walking:

- The map is the primary canvas.
- Route mode selection must be reachable with one hand.
- Route differences must be understandable at a glance.
- Use plain-language reasons such as “better lit”, “step-free”, “avoids construction”, and “+3 min”.
- Show uncertainty explicitly using labels such as “High confidence”, “Community reported”, “Verified 3 days ago”, or “Accessibility unknown”.
- Avoid dashboards full of tiny metrics.
- Avoid excessive gradients, glass effects, floating cards, or motion that competes with the map.
- Use a restrained neutral palette plus one distinctive Jom! accent established during the design-system pass.
- Safety, accessibility, and verification states must never rely on colour alone.
- Minimum interactive touch target: approximately 44×44 points/dp.
- Support system font scaling and screen readers.
- Keep destructive or risky actions visually distinct.
- Use haptics only where they reinforce an important state change.

Core screens for the MVP:

1. Onboarding and preference setup.
2. Home map with origin/destination search.
3. Route profile selector.
4. Route comparison bottom sheet.
5. Active navigation / route detail.
6. Report barrier flow.
7. Share route flow.
8. Community route feed/detail.
9. Profile/preferences.

## Product safety and privacy rules

These rules are non-negotiable.

### Do not collect a full Malaysian IC number

Do not implement full IC-number registration merely to infer age. Use optional age brackets only if needed, and prefer direct route needs such as “avoid stairs” or “prefer well-lit paths”.

### Do not guarantee safety

Never label a route simply “Safe”. Use wording such as:

- “Safer at Night”
- “Better safety indicators”
- “Safer based on available data”

Display that conditions may change. Lighting, security proximity, and community reports are indicators, not guarantees.

### Missing accessibility data is not accessible data

Unknown accessibility attributes must remain unknown. Do not default missing fields to “accessible”.

### Community data is not verified data

Use distinct states:

- Community submitted
- Confirmed by multiple users
- Township/venue verified

Temporary reports should expire or require reconfirmation.

### Do not use demographic neighbourhood risk scoring

Safety scoring may use observable route conditions such as lighting, crossings, verified staffed facilities, closures, and recent trusted reports. Do not score neighbourhoods based on race, income, religion, age composition, or other resident demographics.

### Location privacy

- Ask for location permission only when needed.
- Allow manual origin entry.
- Do not store full route history by default.
- Do not ship secrets or service-role keys in the mobile app.
- Use Row Level Security for user-owned Supabase data.
- Keep analytics aggregated where possible.

## MVP technical direction

### Confirmed development target (2026-10-15)

Support both an Android Studio emulator and a physical Android phone for native development and manual verification, as requested by the user. Expo Go is permitted for testing. Use Android Studio's configured Android SDK/platform-tools and ADB. Record actual SDK/device availability in PLAN.md. Metro exports and TypeScript checks do not prove native map rendering on either target.

Unless the existing repository already contains a coherent stack that should be preserved, use:

- **Mobile:** React Native + Expo + TypeScript + Expo Router.
- **Routing API:** Python + FastAPI.
- **Routing algorithm:** NetworkX using Dijkstra or A* over a weighted pedestrian graph.
- **Persistence/auth/storage:** Supabase.
- **Map UI:** Prefer the simplest current Expo-compatible map library that can render the pilot route geometry reliably. Start with `react-native-maps` unless the repository already uses a different stable map layer. Use OpenStreetMap-derived data for the pedestrian graph where appropriate, but do not block the MVP on a custom basemap.
- **Animation:** React Native Reanimated / Expo-compatible primitives, guided by the animation skills.
- **Testing:** Vitest/Jest-compatible tests for mobile logic and Pytest for the API/routing engine.
- **Linting/formatting:** ESLint + TypeScript strict mode for mobile; Ruff + Pytest for Python.

If a dependency choice becomes unstable or incompatible with the current Expo SDK, create a small spike, document the evidence in `PLAN.md`, choose the lower-risk alternative, and continue.

## Intended repository layout

If starting from an empty repository, use this shape:

    AGENTS.md
    PLAN.md
    TODOLIST.md
    README.md
    package.json
    pnpm-workspace.yaml
    .env.example
    apps/
      mobile/
        app/
        src/
          components/
          features/
          lib/
          services/
          theme/
          types/
        assets/
        __tests__/
    services/
      api/
        app/
          main.py
          api/
          models/
          routing/
          services/
        data/
          pilot/
        tests/
        requirements.txt
        requirements-dev.txt
    supabase/
      migrations/
      seed.sql
    docs/
      reference/
      demo/
    scripts/

If the repository already exists, preserve its good conventions. Do not rearrange everything just to match this structure unless the change is justified in `PLAN.md`.

## Core routing model

Represent the pedestrian environment as a graph.

- A **node** is an intersection, entrance, crossing, ramp, elevator, or important waypoint.
- An **edge** is a walkable segment between two nodes.
- Each edge can store time, distance, lighting, accessibility, security proximity, slope, surface quality, public/activity context, closures, verification source, and freshness.

Use a generalised edge cost concept:

    cost =
      time_weight * time_penalty
      + safety_weight * safety_penalty
      + accessibility_weight * accessibility_penalty
      + preference_weight * preference_mismatch
      + confidence_weight * confidence_penalty

Profile behavior:

- **Fastest:** time dominates.
- **Safer at Night:** lighting, active/public context, crossings, and verified staffed-facility proximity receive substantially higher weight.
- **Step-Free:** stairs and known non-accessible barriers are hard exclusions, not merely penalties.
- **Custom:** explicit user preferences adjust weights and hard constraints.

The exact prototype weights are tunable and must be isolated in configuration, not scattered through UI code.

## Data integrity rules

Every pilot edge should support enough metadata to explain a recommendation.

Expected core fields include:

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
    source
    verification_level
    confidence_score
    last_updated_at

Do not fabricate real-world safety claims. If real pilot-area attributes have not been verified, use a clearly labelled simulated/demo dataset.

## API contracts

The routing API should expose at minimum:

    GET /health

Returns HTTP 200 when the API is ready.

    POST /v1/routes

Accepts origin, destination, route profile, departure time, and optional preferences. Returns 1–3 route options with:

- route identifier
- geometry
- estimated walking time
- distance
- profile
- explanation reasons
- relevant accessibility/safety flags
- data confidence
- last-verified information where available

Keep route-scoring logic in the API/routing layer. Do not reproduce scoring rules independently in the mobile UI.

## Code style

### TypeScript / React Native

- TypeScript strict mode.
- Prefer small functional components and hooks.
- Keep screen files thin; move logic into feature modules.
- Avoid `any` unless an external API forces it and the boundary is documented.
- Use semantic names such as `RouteOptionCard`, `RouteProfileChip`, and `ConfidenceBadge`.
- Centralise design tokens.
- No hard-coded spacing/color values scattered through screens.
- Prefer explicit state machines or clear discriminated unions for loading/success/error/empty states.
- Do not put network calls directly inside presentational components.

### Python

- Use type hints.
- Pydantic models define external request/response contracts.
- Keep graph loading, edge scoring, route generation, and explanation generation separate.
- Configuration owns profile weights.
- Raise meaningful domain errors and convert them to clean API responses at the boundary.
- Keep deterministic routing tests with fixture graphs.

## Testing instructions

Before finishing any implementation task, run the checks relevant to the changed area.

Expected root workflow once configured:

    pnpm install
    pnpm lint
    pnpm typecheck
    pnpm test

For the API:

    python -m pytest services/api/tests
    python -m ruff check services/api

Also exercise the user-visible flow manually in the Expo dev build or emulator.

Critical routing tests:

- Fastest chooses the lower-time path in the fixture graph.
- Safer-at-Night can choose a slightly longer better-lit route.
- Step-Free never returns an edge containing stairs when no accessible alternative exists on that edge.
- Missing accessibility data remains unknown and affects confidence.
- Closed paths are not returned.
- Route explanation matches the actual attributes that caused the route to be selected.
- Identical input produces deterministic ordering when scores tie.

Critical mobile tests:

- Route mode change updates results and labels.
- Loading, no-route, timeout, permission-denied, and unknown-data states render correctly.
- Route cards expose labels to accessibility services.
- Reduced-motion mode does not rely on animation to convey state.

# Git Attribution

1. Do not use tool, assistant, or automation identities as Git commit authors.
2. Codex must never appear as a Git author, committer, co-author, or GitHub contributor for this repository.
3. Attribute repository commits to the actual human contributor or maintainer responsible for the change unless the user explicitly requests a different author.
4. If a generated commit accidentally uses an assistant identity, tool identity, or any non-human identity, rewrite it before pushing so GitHub contributors reflect the correct human account.

## Working method for Codex

### GitHub destination and push approval

- For the remainder of this project, the only authorized push destination is `https://github.com/aanatidae/jomapplication`.
- Do not push any commits, branches, or tags until the user gives explicit full consent and approval for the push. Naming the repository, requesting implementation, or completing a milestone does not grant push approval.
- Prepare and verify local changes first so the user can review the proposed push. Never infer approval from silence or an earlier instruction to use this repository.
- This destination rule is not standing push approval. Record explicit publication authorization in PLAN.md; future pushes still require the user's consent.

At the start of every substantial task:

1. Read `AGENTS.md`, `PLAN.md`, and the relevant section of `TODOLIST.md`.
2. Inspect the existing repository before editing.
3. Read the relevant installed skill files.
4. State the milestone internally and update `PLAN.md` if the current state has changed.
5. Make the smallest coherent implementation that creates observable progress.
6. Run relevant tests and inspect the UI.
7. Apply `break-ui` to completed screens.
8. If motion changed, apply `review-animations`.
9. Update `PLAN.md` and `TODOLIST.md` with evidence.
10. Commit only at a stable milestone if Git is configured and the working tree does not contain unrelated user changes.

Never delete, overwrite, or reformat unrelated user work.

## Definition of done for the hackathon MVP

The MVP is done only when a fresh user can:

1. Open the app.
2. Enter or select an origin and destination.
3. Compare at least Fastest, Safer at Night, and Step-Free routes.
4. See a visible difference in at least one seeded scenario.
5. Understand why each route was recommended.
6. See confidence/freshness information.
7. Submit a barrier report.
8. Share or view a community route.
9. Complete the flow without encountering broken loading/error/empty states.
10. See a polished, accessible interface suitable for a five-minute hackathon demo.

The system must also pass the routing tests and mobile lint/type checks described above.

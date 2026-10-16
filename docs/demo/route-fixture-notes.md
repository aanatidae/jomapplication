# Simulated pilot graph and offline route engine

**SIMULATED / DEMO ONLY.** Every node, geometry, environmental score, accessibility attribute,
source, confidence value and verification label in this fixture is synthetic. Nothing describes
a real venue or street. This dataset demonstrates algorithm behavior, not personal safety or
wheelchair-accessibility certification. It is not for navigation.

## Run the demonstration

From the repository root in PowerShell:

```powershell
./.venv/Scripts/python.exe -m services.api.app.routing.demo
./.venv/Scripts/python.exe -m ruff check services/api
./.venv/Scripts/python.exe -m pytest services/api/tests
npm run check
```

On macOS/Linux use `.venv/bin/python`. No server, network, database or mobile app is needed
for the routing demonstration. `docs/demo/phase3-routing-results.txt` records its output.

## Dataset and topology

`services/api/data/pilot/simulated_demo.json` is version 1, with 11 nodes and 14 directed
segments. Coordinates are **local metres, not longitude/latitude**. Segment distances/times
are authored demonstration measurements, not surveyed geometry lengths. Reverse travel
requires an explicit reverse segment; it is never inferred. Duplicate directed node pairs
are rejected rather than silently overwriting parallel paths. This prototype uses DiGraph,
not MultiDiGraph.

The main trip is Transit Stop → Residential Block. The latter is typed as an entrance so
entrance checks apply. Other nodes represent a stair junction, community plaza, security
post, ramp, curb crossing, mall entrance, park gate, elevator and disconnected gate.

| Family | Segments | Time / distance | Demonstration purpose |
| --- | --- | --- | --- |
| A | a1, a2 | 8 min / 600 m | Shortest usable path; weak lighting/activity; confirmed stairs |
| B | b1, b2, b3 | 10 min / 720 m | Better lighting, active public frontage and simulated verified staffed-security proximity; slope/entrance information incomplete |
| C | c1, c2, c3, c4 | 12 min / 830 m | No recorded stairs; ramp, curb cuts, wide smooth paths, manageable slope and recorded accessible entrances |
| U | u1, u2 | 14 min / 900 m | Unknown accessibility/lighting, stale community report, low source confidence |
| Closed shortcut | closed_shortcut | 1 min / 90 m | Tempting but closed: excluded for every profile |
| Elevator connection | lift1, lift2 | 2 min / 200 m | Required elevator out of service: excluded for every profile |

The disconnected gate demonstrates a clean no-route failure. Family U deliberately contains
both an omitted `stairs` field and an explicit null; both remain `None`. A recorded false
means confirmed absence. No default converts missing values into accessibility claims.

Fixture timestamps use a fixed `reference_time` of 2026-10-16T12:00:00Z. Default demo results
do not depend on the wall clock. Callers may provide an explicit timezone-aware `as_of` to
evaluate another time. Verification labels and freshness are simulated metadata, not real checks.

## Modules and internal contract

`services/api/app/routing/` contains:

- `models.py`: strict, immutable Pydantic node/edge/pilot records and internal route result.
- `graph_loader.py`: JSON validation, topology/geometry integrity and canonical NetworkX graph.
- `profiles.py`: centralized demonstration weights and routing policy constants.
- `scoring.py`: exclusions, normalized environmental/accessibility penalties and exposure costs.
- `engine.py`: candidates, detour limits, deterministic ranking and geometry/result assembly.
- `explanations.py`: reasons from actual selected edges and the actual fastest baseline.
- `confidence.py`: data-quality categories and explicit missing/stale/source warnings.
- `errors.py`: graph, query, no-route and search-budget domain exceptions.
- `demo.py`: offline console demonstration.

`compute_routes(graph, origin, destination, profile, max_results=3, as_of=None)` returns an
immutable tuple of internal `RouteResult` records. Each carries ID, dataset/demo label,
profile, node path, segment IDs, geometry, distance/time, cost, reasons, warnings, confidence
and verification summary including oldest known update/missing timestamps. Public HTTP
request/response contracts remain Phase 4 work. Existing `/health` and `/spikes/route`
are preserved; no `/v1/routes` endpoint or mobile integration was added.

## Weights and normalization

These are **configurable hackathon demonstration weights, not scientifically calibrated**:

| Profile | Time | Environmental indicators | Accessibility | Data confidence | Time limit |
| --- | ---: | ---: | ---: | ---: | --- |
| Fastest | 1.0 | 0 | 0 | 0 | No profile detour cap |
| Safer at Night | 1.0 | 2.0 | 0 | 0.4 | At most 1.5× the fastest usable route's ETA |
| Step-Free | 1.0 | 0.1 | 0.5 | 0.5 | No cap that would force inaccessible shortcuts |

Custom preferences are out of scope; preference mismatch weight is effectively zero.

Time exposure is `estimated_time_s / 600`. It is intentionally not clamped: a very long
segment must keep costing more. Environmental, accessibility and confidence penalties are
dimensionless values in [0,1]. The additive edge cost is:

```text
exposure × (time_weight
          + safety_weight × environmental_penalty
          + accessibility_weight × accessibility_penalty
          + confidence_weight × (1 − edge_data_quality))
```

Thus penalties are integrated over walking time; cutting a segment into two records with
identical attributes does not arbitrarily double its environmental penalty. Costs are not
600 seconds plus a 0.2 lighting score. The engine quantizes each edge cost to integer
nanocosts (1e-9 normalized units; minimum one unit) for stable tie groups. This introduces
at most half a nanocost of rounding per ordinary edge and is not measurement precision.

Environmental penalty is the equal mean of poor lighting, poor crossings, low public
activity and facility-distance penalty. A known score contributes `1 − score`; an unknown
indicator contributes 0.75. Verified staffed-security proximity uses `min(distance/300m,1)`
only when explicitly flagged verified, supported by confirmed/venue verification and not
stale/future-dated. Otherwise it contributes 0.75, never a positive proximity claim.

Accessibility penalty averages recorded stairs, absolute slope/8.33 (capped at 1), width
(wide 0 / standard .2 / narrow 1) and surface (smooth 0 / firm .2 / rough .8 / impassable 1).
Incomplete critical accessibility data contributes .75. Ramp/curb-cut attributes establish
crossing transitions and explain geometry; they do not award an arbitrary bonus to a ramp
over an otherwise suitable flat path.

## Hard constraints

All profiles exclude closed paths, impassable surfaces and required elevator connections
whose status is not operational. Step-Free additionally excludes:

- Confirmed stairs; no finite weight can make them win.
- Missing stairs, slope, width, surface or elevator-required status.
- Slope magnitude above the **prototype** 8.33% limit, narrow width or rough surface.
- Recorded inaccessible entrances; unknown entrance accessibility on entrance connections.
- Crossings without a recorded curb cut or ramp, including unknown transitions.

Entrance/crossing context is derived from node kinds, not path names. The slope and width
policies are demonstration assumptions, not regulatory compliance or a complete wheelchair
model. Optional ramp/curb fields on ordinary flat paths need not be true. If no established
step-free path remains, `NoRouteError` is raised; there is no silent fallback through stairs
or unknown critical data. A path with stale/unverified provenance can retain recorded
traversal suitability but receives explicit data-quality warnings, not an accessibility guarantee.

## Candidate generation and ties

NetworkX `shortest_simple_paths` (Yen's algorithm) generates loopless candidates from a
filtered graph using positive profile costs. The graph is inserted canonically. Results
sort by total integer cost, estimated time, distance, then ordered segment IDs. The engine
examines the entire equal-cost group at the requested result boundary, so requesting one
result cannot skip a shorter/closer tied candidate. Route IDs use SHA-256 over dataset,
profile and segment path, independent of process hash randomization or fixture array order.

The engine returns up to three results. A 2,000-candidate budget raises `SearchLimitError`
if exhausted before ranking is established; it does not silently truncate an unresolved
tie group or claim no route. This is suitable for a contained pilot, not nationwide imports.
The night detour limit filters actual ETA against the fastest baseline. Step-Free is not
forced into a 1.5× limit, because known accessibility blockers are hard exclusions.

Algorithm reference: [NetworkX shortest_simple_paths documentation](https://networkx.org/documentation/stable/reference/algorithms/generated/networkx.algorithms.simple_paths.shortest_simple_paths.html).

## Data confidence, not personal-safety probability

Per-edge quality averages source confidence, verification quality, freshness, environmental
completeness and critical accessibility completeness. Verification quality is 1 for venue,
.7 for multiple-user confirmed, .45 for community and .25 for unverified. Freshness is 1
through 7 days, .75 through 30 days, .25 when older; missing/future timestamps score zero.

The score cannot exceed supplied source confidence. Unknown critical accessibility,
community/unverified provenance, missing source confidence or environmental data cap it at
.65. Stale/missing/future timestamps cap it at .45. The weakest edge controls route confidence:
High ≥ .8, Medium ≥ .5, otherwise Low. Warnings explain incomplete accessibility counts,
community-only provenance, stale timestamps, missing environmental data and low/missing
source confidence. No confidence percentage is exposed as a safety prediction.

High confidence on family A means the synthetic records are complete/recent; it does **not**
mean the stair route is accessible or safe. Family B is Medium because two segments lack
critical accessibility metadata. Family C is High for recorded demo data.

## Evidence and limitations

Tests change travel times, lighting/public/proximity attributes, closures and traversal
metadata; winners change because of costs and constraints. Tests also cover full geometry,
equal-cost ties (including ties beyond K), reordered JSON, unknown vs false, malformed
records, no-route errors, operational/unavailable lifts, crossing transitions, freshness,
low-confidence bottlenecks and exposure normalization.

Final checks: Ruff passes, all 92 API tests pass (89 routing cases plus 3 preserved tests),
and `npm run check` passes lint, strict TypeScript and 14 mobile tests. All tests are offline; only the preserved
health/spike tests use in-process FastAPI TestClient. No mobile code, live map drawing,
geocoding, Supabase, authentication, community features or external datasets were changed.
This fixture is directed and intentionally tiny; unmodelled barriers, ramp widths, turning
radii, individual mobility needs, timed closures and live elevator status remain limitations.

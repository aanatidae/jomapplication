# Phase 10 evidence — 2026-10-18

Baseline clean Git at af31df2. Original npm run check: lint, TypeScript and 79 tests passed; Ruff and 119 API tests passed. Phase 10 gate: lint, TypeScript, 85 tests/12 suites; Ruff and 121 API tests passed. Actual host commands used because sandbox TestClient/Expo/Jest stalls reproduce. API contract exact-field regression updated for additive data_quality metadata.

New tests cover confidence mapping/unknown, evidence-dependent verification labels, unknown/future timestamps, local-calendar formatting, category freshness, exact report-expiry boundary, mounted expiry refresh, unknown route metadata and source inspection. Backend tests cover source/update provenance, null verification timestamp, incomplete access and stale quality. Existing Step-Free constraints, stale-response suppression, repository/Supabase tests remain passing.

Android Studio AVD Medium_Phone_API_37.0, Expo Go, isolated Metro 8082, loopback API 8000. Captures: data-details (source synthetic_fixture_author; last update; verification unknown; incomplete accessibility), community (Community submitted; last-walked unknown), report-history-final (existing temporary report, unconfirmed active state, report date and expiry). The legacy tap helper initially scrolled past Reports; direct existing route opening corrected navigation. Earlier report-history/reports-current captures show Planner and are not report evidence.

Policies/rules are recorded in PLAN Decision Log. No DB migration, RLS/Storage change or confidence algorithm duplication. No confirmation counter or genuine last-verified timestamp exists; unknown is deliberate. Existing protected verified state is available; no unverified item is upgraded. Temporary reports remain history and do not mutate the routing graph.

Native historical expiry boundary is tested by controlled clock in Jest; the stored Android report was still active at capture. Physical phone, iOS and spoken TalkBack/VoiceOver not tested. Phase 0 geographic provider issue remains; existing labelled schematic preserved.

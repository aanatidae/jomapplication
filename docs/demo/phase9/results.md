# Phase 9 — Supabase verification

Verified 2026-10-17. Phase 9 is complete for the hackathon scope. No Phase 10+ work,
commit or push was performed. Baseline Git was clean at `11f09b1`.

## Project and configuration

Fresh **Jom!** development project, Free plan, Singapore. Created through the signed-in
Supabase dashboard; user performed the database-password step and explicitly confirmed
anonymous sign-ins. No database password, service-role key or secret key was retrieved
or added to mobile. The real public URL/key are only in ignored `apps/mobile/.env.local`.
`git check-ignore` matches that file and `git ls-files` returns no tracked entry.
Both environment examples contain blank Supabase placeholders.

Applied the tracked SQL to the confirmed empty hosted schema. Migrations
`202610170001_phase9.sql` and `202610170002_validate_snapshots.sql` are recorded in
CLI-compatible history. Database inspection confirmed both versions, RLS=true on all
three application tables and migration history, plus three deterministic demo routes.
[Database evidence](database-verified.png).

## Live policy and Storage validation

Executed `node --env-file=apps/mobile/.env.local scripts/verify-supabase.mjs` against
the hosted project using two independent anonymous users and **only the public key**.
Repeated after deployment; the expanded final live run passed all of these:

| Assertion | Result |
| --- | --- |
| Client/public key accepted, two real guest sessions/user IDs created | Pass |
| A and B create/update own profiles, routes and barrier reports | Pass |
| A cannot read/update B's profile; B cannot read/update A's profile | Pass |
| Cross-user route/report updates and deletes rejected or affect zero rows | Pass |
| Cross-user ownership inserts and ownership changes rejected | Pass |
| Signed-out clients cannot create routes/reports | Pass |
| Insert verified content or promote to confirmed/verified rejected | Pass |
| Published community routes/reports readable by public client | Pass |
| New content defaults to community_submitted | Pass |
| Temporary expiry equals server reported_at + 24 hours | Pass |
| Fresh client restores session and reloads saved onboarding/preferences | Pass |
| Route and report images upload; public image URL returns HTTP 200 | Pass |
| Cross-user image overwrite/delete blocked | Pass |
| Unsupported document/MIME upload rejected | Pass |

Disposable test rows, profiles and images were removed afterward. Anonymous test auth
identities remain for administrator cleanup; no sessions/tokens are printed or stored
in these artifacts. This is a real API/RLS test, not a privileged-client simulation.

## Native end-to-end flow

Android Studio `Medium_Phone_API_37.0`, Expo Go 57, localhost Metro 8082 with ADB
reverse; unchanged routing API on 8000. UI actions use observed Android UI trees.

1. Explicit **Continue as guest** created a real identity.
2. Completed onboarding with prefer well-lit and avoid-stairs selected.
3. Cold force-stop/reopen skipped onboarding; Profile retained both selections.
   [Before](profile-before-restart.png), [after](profile-after-restart.png).
4. Community loaded three hosted seeds. [Seed feed](community-seeded.png).
5. Shared `DEMO Supabase restart walk` using the illustrative Step-Free path, Walking
   purpose and existing non-personal Expo demo image selected through Android's picker.
   Submission succeeded as Community submitted. [Submission](route-submit-result.png).
6. After a second cold restart, Community still contained the new route and its public
   Storage image rendered in detail. [Feed](community-after-restart.png),
   [photo](shared-route-photo.png).
7. Planner continued calling the independent FastAPI graph; avoid-stairs selected the
   10-minute alternative. Report Barrier associated the report with route point 1.
   [Active route](planner-reopened.png), [report location](report-location.png).
8. Submitted `DEMO temporary blocked path for Supabase restart validation`, temporary
   condition and a system-picker photo. Success showed Community submitted, a server
   timestamp, 24-hour expiry and the uploaded image. [Review](report-review.png),
   [success](report-submit-result.png).
9. After cold restart, Reports loaded the same description, timestamp, expiry and
   photo from Supabase. [Before](reports-before-restart.png),
   [after](reports-after-restart.png).

Second-user ownership was tested through real independent public-key clients, rather
than adding account-switching UI. No dashboard row edits were needed during the demo.
No fresh physical-phone, iOS, spoken TalkBack or native 320dp/200% audit is claimed.
The preserved Phase 6–8 stress suites pass; new auth tests cover loading, signed-out,
busy/disabled guest submission, signed-in and recoverable error states. No motion/layout
redesign was introduced.

## Final quality gates

| Command | Actual result |
| --- | --- |
| `npm ci --no-audit --prefer-offline` | Pass, 1075 packages |
| `npm run check` | Pass: original Expo lint, strict TypeScript, 79 tests / 11 suites |
| `./.venv/Scripts/python.exe -m ruff check services/api` | Pass |
| `./.venv/Scripts/python.exe -m pytest services/api/tests` | 119 passed; existing httpx/Starlette warning |
| `npm exec --workspace mobile -- expo export --platform android --output-dir ../../.local/phase9-export-final` | Pass, Android Hermes production bundle |
| Live policy/Storage command above | Pass |
| `git diff --check` | Pass |
| Source inspection | No direct Supabase queries in screens; no mobile privileged key |

Unit coverage includes all DB mappings, owner-sourced inserts, forced submitted state,
image types/size, ArrayBuffer upload, upload/metadata failures, cleanup failure ordering
and auth states. Ordinary tests do not require a live project.

The final lockfile retains **every baseline package entry/version/location** and adds
only ten Phase 9 entries (three direct dependencies). Temporary installer relocation,
patch upgrades, root React-type workaround and lint-launcher workaround were removed.
Expo compatibility check reports pre-existing patch advisories: Expo 57.0.29 → ~57.0.30
and Router 57.0.27 → ~57.0.28. They are recorded, not treated as a Phase 9 regression;
native flows, all required checks and Android export pass on the preserved baseline.

## Deliberate limits

- No Docker daemon: hosted migrations/RLS/Storage were tested; local Docker reset was
  documented but not run. No CLI management credentials were requested/retrieved.
- Database types are schema-aligned and maintained locally, not CLI-generated.
- Guest identity is lost if app storage is cleared; no account recovery/offline sync.
- One photo per form; no confirmations/bookmarks, operator verification UI or moderation
  backend. Existing content flags remain explicitly local.
- Public photos are for non-personal route/report images. Failed cleanup may leave an
  unpublished draft/orphan file. Cleanup removes row before image; if row deletion fails,
  it retains the image to avoid an ambiguous published broken reference.
- Feed returns the latest 100 records; production pagination, per-user quotas, CAPTCHA,
  moderation and abandoned guest/orphan cleanup are future work.

See [setup and migrations](../../../supabase/README.md) and [root README](../../../README.md).

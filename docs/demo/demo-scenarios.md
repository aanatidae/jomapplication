# Jom! demonstration runbook

Use the normal FastAPI + Supabase app. Every pilot route and map is **SIMULATED / DEMO**, not geographic navigation. Community submissions do not change the graph. Say **“Safer based on available data.”** Conditions can change; confidence describes data quality, not a probability of personal safety.

## Before presenting

1. Follow the root README installation and Supabase migration instructions. Use your own public project URL/key; enable anonymous sign-ins. Never put a privileged key in Expo.
2. Start the API and Metro. For USB/emulator localhost, reverse both API 8000 and the actual Metro port (normally 8081; evidence on this machine uses 8082). Open Expo Go and Continue as guest if prompted.
3. In Profile, note your existing preferences before changing them. Reset preferences, choose **No limit**, then **Save preferences**. Reset alone only edits the form. All needs must be off for the baseline 8/10/12 results. Existing needs legitimately change recommendations.
4. Planner: choose **Transit Stop → Residential Block** using the place controls. Select Fastest. Do not use `/stress`, `/spikes/map` or `?demoState=...` previews for the engine demonstration.
5. Check health and the repeatable live routing smoke test:

```powershell
node scripts/verify-demo-routes.mjs
node --env-file=apps/mobile/.env.local scripts/demo-setup.mjs --seed
node --env-file=apps/mobile/.env.local scripts/demo-setup.mjs --check
```

The seed command inserts one labelled community route and one labelled barrier with unknown duration, using an ordinary anonymous guest and RLS. These are schematic fixtures, separate from the calculated routes. It never updates or deletes a record. A second run reuses IDs saved **before** insertion in ignored `.local/demo-session.json`; interrupted inserts can be checked without creating duplicates. Keep this file private: it contains the demo guest session. Do not copy it into source, screenshots or another project. A missing/expired manifest is an actionable error, not permission to delete or impersonate an owner. Do not delete the manifest to “reset”; doing so creates a new identity on the next seed run. Anonymous identities need eventual administrator cleanup.

`--check` performs no content writes or anonymous signup; restoring the stored session can refresh its tokens and update the local manifest. `--reset` is rejected before any connection. Hosted data is never cleared. The three SQL seed routes in `supabase/seed.sql` are also idempotent and can be installed on a confirmed development project following `supabase/README.md`.

## Safe repeat / reset

Return to Planner, choose the same trip and Fastest; reset and save **only your own** preferences if needed. Re-run `--check` (or `--seed` to fill absent manifest-owned fixtures). Existing community posts/reports deliberately remain. Use a visibly named rehearsal post once, then show its detail on later rehearsals. New deliberate submissions make new posts; the command does not promise to deduplicate intentional user actions. The forms guard rapid duplicate taps while a save is pending. If a save result is uncertain after network loss, inspect the feed/history before submitting again.

For an entirely empty database, create a separate development project or an isolated local Supabase instance. `supabase db reset --local` is destructive to that local instance; inspect its target and preserve needed data first. Never use a remote reset. Deleting hosted demo content requires an administrator to review exact owner/IDs and get explicit confirmation; this runbook provides no remote deletion command. Restore your saved preferences after rehearsal.

## Scenario A — same trip, night priority

**Prerequisites:** baseline preferences, API running, default trip. **Actions:** Fastest; inspect comparison; Safer at Night; inspect selected option and Route data details.

**Expected:** calculated Fastest **8 min / 600 m**, stairs; calculated Safer at Night **10 min / 720 m**, **+2 min vs fastest**, better lighting, active public areas and a staffed public/security point **inside the synthetic fixture**. Geometry, selected thick line, option number, ETA and distance change. Safer at Night has Medium data confidence because accessibility is incomplete. Dates/unknown verification remain explicit. Other alternatives can appear under the requested profile; “Option 1” is the engine recommendation.

**Explain to judges:** “Same origin, same destination. A two-minute trade-off changes which environmental indicators we prioritise. This is simulated data, not a guarantee of safety or a claim about an actual security service.” **Recovery:** if values differ, check saved needs and detour; if unavailable, use the recovery section, then Retry. Do not substitute a mock and call it a live calculation.

## Scenario B — step-free need

**Actions:** with the same endpoints select Step-Free; scroll to its reasons and confidence. **Expected:** **12 min / 830 m**, different geometry, no stairs; ramp, curb-cut and entrance reasons from the engine. Unknown critical accessibility edges are excluded; an impossible trip returns no route rather than a stairs fallback. High confidence here reflects recorded synthetic attributes. **Explain:** “Accessibility constraints can change the valid path, not just add a cosmetic preference.” **Recovery:** check endpoints/preferences; retain and explain a genuine no-route result rather than relaxing accessibility.

## Scenario C — community route sharing

**Prerequisites:** guest session, Supabase connectivity, non-personal JPEG/PNG/WebP under 10 MB if attaching a photo. **Actions:** from Planner choose Share selected route, enter a clearly labelled `DEMO` title and notes, choose Walking, optionally a photo, and Submit route once. Wait for **Route shared**; open View shared route, then Community. Restart Expo Go and re-open the post.

**Expected:** the selected calculated route snapshot, notes/photo and **Community submitted** remain after restart. No invented confirmation count or automatic verification. A success screen follows persistence. Public photos should contain no faces, identity documents or personal information. A local image preview alone does not prove upload.

## Scenario D — barrier reporting

**Prerequisites:** the same guest/Supabase connection as C. **Starting screen:** Planner with a calculated route selected. Choose **Report Barrier**. Choose **Broken or blocked walkway**, Continue, select **Route point 2** (schematic, not GPS), Continue, enter `SIMULATED rehearsal barrier — conditions unknown`, choose Temporary, optionally a photo, Continue, review, Submit report once. View reports; restart and open Reports again. **Expected:** report description/location, Community submitted and temporary 24-hour expiry survive; expired reports remain distinguishable and do not silently affect routing. **Explain:** “Community knowledge is persisted separately from trusted route data; a report needs confirmation before operational use.” **Recovery:** preserve the draft on failure, check connectivity, inspect feed/history for an ambiguous save, then retry only if absent. Photo failure may leave a private draft/orphan requiring later administrator cleanup; do not show success for it.

## Recovery

**API unavailable:** trip remains visible, results become an error with Retry. Restore the API/reverse port and Retry; it bypasses the cache. Check `/health` and `verify-demo-routes.mjs`. Do not clear preferences or app storage.

**Supabase unavailable:** auth/feed/share/report errors remain explicit. Restore connection, retry loading or saving, and check for an already-created record after an ambiguous failure. Do not replace the public key with a privileged key or disable RLS. Authentication recovery can require Continue as guest again; clearing app storage loses the original anonymous identity.

**Optional planned offline presentation:** set `EXPO_PUBLIC_DATA_MODE=local` and restart Metro deliberately before presenting. UI says **Local demo · saved on this device only**; local and hosted collections are separate. Routing still needs FastAPI. This is not automatic network failover or evidence of hosted persistence. No new API-offline fake calculation fallback is needed; explain the error and recover the API.

## Proposed five-minute spoken schedule

| Time | Demonstration |
| --- | --- |
| 0:00–0:30 | Problem, same-trip claim, simulated pilot and uncertainty |
| 0:30–1:45 | A: Fastest → Safer at Night; two-minute trade-off |
| 1:45–2:45 | B: Step-Free; hard exclusions and confidence |
| 2:45–4:00 | C: share, report and persisted feed/history |
| 4:00–5:00 | Recap evidence, limitations, next production steps |

This is a proposed presenter schedule, **not a measured five-minute human rehearsal**. Do the restart/persistence checks during setup; repeated automated UI-tree captures add time unrelated to a spoken pitch. Run through once on the actual presentation phone and network before judging. No deck or video is required.

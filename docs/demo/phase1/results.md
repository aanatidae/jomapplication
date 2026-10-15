# Phase 1 verification — 2026-10-15

Phase 1 is complete. Expo SDK 57, React Native 0.86.3, Expo Router, FastAPI and NetworkX dependencies are preserved. npm workspaces extend Phase 0's npm setup; one root lockfile replaces the app-local lockfile. The Phase 0 routing spike is unchanged; no production routing or Supabase integration was added.

## Automated checks

| Check | Result |
| --- | --- |
| Root `npm ci` | Passed |
| Root `npm ci --no-audit` | Passed; audit run separately |
| `npm run check` | Lint, strict TypeScript, 3 navigation tests passed |
| `python -m ruff check services/api` | Passed using root .venv |
| `python -m pytest services/api/tests` | 3 passed using root .venv |
| Python frozen requirements install | All satisfied, checked with --no-index |
| `GET /health` over localhost | HTTP 200, `{"status":"ok"}` |
| Expo SDK dependency check | Passed |
| Expo Doctor | 21/21 passed |
| Final Android Hermes export | Passed |
| Root ignore rules | Secrets, envs, caches, generated native/build output and local data ignored; .env.example and source remain includable |

## Android runtime

On Android Studio AVD `Medium_Phone_API_37.0`, Expo Go 57.0.9:

- Root `npm start` serves the shell on IPv4 localhost through ADB reverse.
- Planner -> Community -> Profile -> Planner exercised using UI-tree-derived tap coordinates.
- All three also reachable at 320dp width and Android font scale 2.0. Navigation stacks at constrained effective width to avoid fragmented labels. Original 1080x2400 / 420dpi / font scale 1.0 restored.
- Normal and narrow/large-text screenshots and UI trees are in this folder. No physical phone was connected or tested.

## Remaining limitations outside Phase 1 acceptance

- Phase 0 Google map tiles/overlays remain blank; the preserved spike is `/spikes/map`.
- npm audit has 64 findings (15 moderate, 49 high); see `npm-audit.json`. Compatible remediation remains open. No forced SDK changes applied.
- API test client emits an existing httpx deprecation warning; tests pass.
- Root Git metadata remains absent and the Expo template's nested uncommitted metadata is preserved. No commit, author configuration, remote change, or push performed.
- Production UI, real data, routing profiles, authentication, community persistence and animations remain deferred.

# Phase 0 evidence — 2026-10-15

- Initial project: only three `.harness` files, no root Git repository or implementation.
- Required seven design skills read; no production visual design implemented.
- Android target: Android Studio emulator and physical Android phone; Expo Go permitted.
- FastAPI + NetworkX: 3 Pytest tests pass; Ruff passes. HTTP health and simulated route both return 200. Route time is 120 seconds with three coordinates.
- Expo 57.0.29 / React Native 0.86.3 / react-native-maps 1.27.2: lint, strict TypeScript, SDK dependency validation, Doctor 21/21, Android Hermes export pass.
- Native runtime: Expo Go 57.0.9 on `Medium_Phone_API_37.0`, cold boot with software graphics. App opens and map ready callback fires. Google logo/surface visible, tiles/markers/polyline blank. Screenshot `emulator-phase0.png`. This is not full map-rendering acceptance.
- Physical Android phone: not connected, not tested.
- Metro: IPv6 localhost binding caused failed update downloads. IPv4-first Node resolution + ADB reverse fixes connection; bundle HTTP 200 verified. LAN mode was rejected by approval review; localhost alternative succeeded.
- npm audit: 29 findings, recorded in `npm-audit-phase0.json`; compatible remediation remains open. No forced dependency downgrade applied.

Next: diagnose blank native map/provider behavior, verify on physical Android, then finish Phase 0 and proceed to the Phase 1 root workspace and quality gates. No real pilot data or credentials needed for the simulated routing spike. Standalone Android maps will require a restricted Google Maps SDK key later.

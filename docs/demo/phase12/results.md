# Phase 12 results — 2026-10-18

Full findings, reproduction steps, fixes, coverage matrix and limits: ../ui-accessibility-qa.md.

Final gates: npm run check passes Expo lint, strict TypeScript and 97 mobile tests/15 suites. API Ruff and 121 Pytests pass. Real verify-supabase.mjs passes A/B security, protected verification, expiry, session/preferences and Storage restrictions. Clean npm ci passed with baseline records preserved plus expo-haptics 57.0.3. Android Hermes export passes; git diff --check passes.

Native evidence (PNG + UI XML):
- planner-long-place-small / planner-unknown-small: 320dp, 200% text, long destination and unknown data explicitly labelled.
- onboarding-worst-small / profile-small: long preference labels, unchanged saved preferences.
- community-worst-final / detail-top / detail-bottom / detail-expanded / community-empty-small: max title, tags, long notes, expansion, empty recovery.
- share-keyboard / share-keyboard-final / share-save-error-final / share-retry-visible: focused title, keyboard/system tutorial, clear save failure and reachable retry; use barrier-keyboard for clean normal keyboard visibility.
- barrier-location-small / barrier-details-small / barrier-keyboard / barrier-review-final / barrier-success-final: 2000-character temporary report, labelled non-GPS location, editor keyboard, review and successful isolated local submission.
- restored-planner: original emulator size/density/font restored, real Planner.

Earlier captures with misleading intermediate filenames are documented as non-evidence in the QA report. Native helpers must be serialized; concurrent UI automation registration failures are recorded in automation-crash-buffer.txt and are not app crashes. qa.py uses actual UI-tree bounds, bounded waits and explicit outer-form gutter targeting when a nested editor owns scrolling.

No physical phone, iOS, spoken TalkBack/VoiceOver or release slow-device/FPS/memory verification. No known scoped P0/significant P1 remains. No migrations/security changes, Phase 13/14, commit or push.

# Security and dependency review — 2026-10-18

## Credentials and privacy

Targeted scan covered 375 current text files (tracked plus new non-ignored files), and 838 text-file/blob reads including all reachable Git history. Patterns covered private keys, Supabase secret prefixes, GitHub/AWS tokens, credential-bearing Postgres URLs and JWTs with a role other than public `anon`. No credential material was detected. Binary files and text blobs over 5 MB were excluded; this heuristic is not a general proof against every possible secret format. Environment examples and actual configuration loading/logging were also inspected. `.env.local` and the private demo-session manifest are ignored; no new credentials or session data are staged for publication. No exposure requiring rotation was found.

The actual configured key passed the public-key check used by live integration scripts. Mobile rejects `sb_secret_` and JWT roles other than `anon`. Expo public values are bundled. Supabase errors log operation/code only in development, not payloads, raw provider messages, tokens or credentials. API errors are sanitized. No IC registration, demographic scoring, live location acquisition or automatic route-history persistence exists. Photos are deliberately public with explicit privacy copy; public community reads are intended, not private data leakage.

## Actual database/Storage checks

Both migrations were inspected, including RLS grants/policies, invoker owner/ID/verification guards, bounded JSON snapshots, server-derived temporary expiry and image-path ownership. Actual `verify-supabase.mjs` then passed with **two independently authenticated anonymous users**, not merely SQL inspection:

- Private profiles and owned route/report writes; other-user select/update/delete restrictions.
- Owner/ID immutability and client verification insert/update escalation rejected.
- Published public reads, 24-hour expiry, restored session and persisted preferences.
- Both route/report photo upload prefixes, public image retrieval, other-user overwrite/delete rejection and unsupported MIME rejection.

Its disposable content/images were removed; anonymous auth identities remain for administrator cleanup. Native share/photo/report rows were independently read back and remained unverified. No privileged key, RLS bypass, schema change or destructive remote reset was used. New demo setup has insert-only content semantics, a saved identity/ID manifest and an exclusive local lock; unsupported reset/extra arguments are rejected before network access. Final live seed/check compare every expected fixture field without overwriting it. A held-lock refusal test preserved the private manifest and returned the actionable local-lock message.

Production follow-up remains: account recovery/linking, anonymous abuse controls/CAPTCHA/quotas, moderation, operational verification, retention/orphan cleanup, HTTPS deployment and trusted real-world data operations. Client byte-signature validation plus Storage MIME/size policy is not a malware/content-moderation service.

## Dependency audit: open, not a clean audit

`npm audit --json` reported **65 affected package records: 50 high, 15 moderate, zero critical** in the working installation. The clean lockfile installation reported 64 (49 high/15 moderate); these are propagated dependency-tree records, not 65 distinct vulnerabilities. Five underlying advisories were inspected against the primary advisory pages and installed consumers:

| Advisory | Installed path / exposure assessment | Disposition |
| --- | --- | --- |
| [braces recursion DoS](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | Metro/Jest/build matching; Jom! does not pass community input to glob compilation | No patched release listed; remain open |
| [node-forge signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | Expo CLI/code-signing tooling; not the Supabase server's authentication/RLS verifier | No patched release listed; remain open |
| [decode-uri-component DoS](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) | Expo Router → query-string 7.1.3 → decoder 0.2.2; malformed external links can affect client availability | Patched decoder 0.5.0 exists, but upstream Router upgrade suggestion crosses SDK major; track as a real production link-handling risk |
| [sprintf-js precision DoS](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | Jest/tooling format strings; no application format-string input | No patched release listed; remain open |
| [uuid buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Expo config-plugins → xcode → uuid 7.0.3; affected methods are v3/v5/v6 with caller buffers, not Jom!'s own Node randomUUID | Patched 11.1.1 is a major consumer change; do not force override blindly |

These exposure assessments are source/dependency-path review, not exhaustive exploit testing. For the controlled local hackathon walkthrough, no demonstrated P0/significant P1 exploit was found. They remain security debt and prevent a production-security sign-off. Do not expose Metro publicly or treat this as approval for arbitrary untrusted deep links/build inputs.

`expo install --check` suggests Expo 57.0.30 and Router 57.0.28 versus locked 57.0.29/57.0.27. Native flows and Android exports pass on the lockfile. `npm audit fix --dry-run` failed ERESOLVE while resolving the AsyncStorage/RN peer tree. No actual audit fix, forced install, override, SDK jump or lockfile change was made. Three advisories have no listed patch, and forcing the audit's suggested major versions would not provide a justified stable fix. SDK/dependency migration belongs in a separately tested update. Fresh `npm ci` succeeds without peer overrides. The pending `unrs-resolver` install-script notice did not prevent checks; no blanket script approval was granted.

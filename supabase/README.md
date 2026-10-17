# Supabase

Phase 9 uses a fresh free development project in Singapore. Actual public connection
details stay in ignored `apps/mobile/.env.local`; examples contain placeholders only.
Database passwords, secret keys and service-role credentials never belong in Expo.

## Local development (Docker required)

From the repository root:

```powershell
npx supabase start
npx supabase db reset --local
```

The reset destroys only the CLI's local development database and reapplies migrations
and `seed.sql`. Never run a remote reset. This host has no Docker daemon configured;
the hosted project was validated instead. Use the local URL/public key reported by
your local CLI and `EXPO_PUBLIC_DATA_MODE=supabase`. Android with localhost needs
`adb -s <serial> reverse tcp:54321 tcp:54321`. Anonymous auth is enabled in config.toml.

## Hosted development

Enable **Authentication → Sign In / Providers → Allow anonymous sign-ins**.
The Jom! project was created through the authenticated dashboard, after confirming the
public schema was empty. Versioned SQL was applied there; CLI-compatible migration
history records versions `202610170001` and `202610170002`.

For subsequent migrations, authenticate the CLI using your own account, inspect the
target and migration history, then apply:

```powershell
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase migration list
npx supabase db push --dry-run
npx supabase db push
```

Read the dry run. Do not overwrite an existing remote schema. For a **confirmed empty**
project with browser-only access, `node scripts/build-supabase-bootstrap.mjs` builds
`.local/phase9-bootstrap.sql` from tracked migrations and seed. Apply it once in the SQL
editor. It wraps the migrations, RLS-enabled history and seed in one transaction.
The bootstrap records version/name metadata; authoritative source remains in Git.
Select and clear the entire editor before pasting: filling Monaco's textarea alone
can append to existing content. Prefer CLI db push when available.

`seed.sql` is idempotent and only inserts three deterministic, visibly `DEMO` routes
and their synthetic non-login owner if absent. On hosted development, run that tracked
SQL in an authenticated SQL editor to re-seed. It never clears another user's data.

## Schema and security

- `profiles`: one private preferences row per auth user, exactly the Phase 6 fields.
  Owner read/insert/update/delete; no IC, age or unused profile fields.
- `community_routes`: Phase 7 SharedPath JSON, typed tag constraints, notes, optional
  last-walked date, one photo path, timestamps and verification enum.
- `barrier_reports`: eight enum categories, labelled schematic JSON location, details,
  condition enum and one photo path. Database timestamps reports and derives temporary
  expiry at 24 hours. Reports never mutate the routing graph.
- Public reads for published community routes/reports, owner-only unpublished rows.
  Inserts enforce session ownership and community_submitted. Updates/deletes require
  ownership. Invoker triggers reject changing owner, ID or verification as a client.
  confirmed/verified are reserved for trusted administration, absent from the MVP.
- No image join table: the current forms support one photo. No confirmations table
  or editable count: confirmations/bookmarks remain deferred from Phase 7.
- JSON constraints validate required fields, numeric ranges, bounded schematic points
  and payload size. Indexes cover feed ordering, owner lookups and report expiry.

## Storage and failure handling

Migration 1 creates `jom-community-images`, public read, JPEG/PNG/WebP only, maximum
10 MiB. Only route/report photos belong here; no sensitive documents.

Paths are `community-routes/{user_id}/{route_id}/photo.{ext}` and
`barrier-reports/{user_id}/{report_id}/photo.{ext}`. Uploads require an authenticated
user's path and matching owned pending row. No object UPDATE policy exists;
uploads use upsert:false. Deletion requires the user's path.

Repositories validate actual image bytes and size before writing. They create an
unpublished row, upload an ArrayBuffer, then publish with the photo path. Failure
attempts image/row cleanup and preserves form state for retry. A network failure
during cleanup can leave an unpublished draft or orphan file; there is no background
cleanup or offline sync. The existing picker quality setting is retained.

## Validation and types

Ordinary unit tests need no network. Live tests use only the public client key:

```powershell
node --env-file=apps/mobile/.env.local scripts/verify-supabase.mjs
```

This creates two anonymous identities and disposable rows/images, tests ownership,
verification escalation, public reads, image restrictions and session restoration,
then cleans up content. Auth identities remain for administrator cleanup. Keys and
session tokens are never printed. See [actual evidence](../docs/demo/phase9/results.md).

Schema-aligned TypeScript types are used throughout repository code. They are maintained
locally because dashboard login does not authenticate the CLI type generator. Once
CLI access exists, generate into a temporary file and reconcile JSON model aliases:

```powershell
npx supabase gen types typescript --linked > .local/database.generated.ts
```

Production follow-up: CAPTCHA for anonymous creation, account linking/recovery,
per-user write/storage quotas through a trusted gateway, moderation, orphan cleanup
and removal of abandoned guest accounts. Existing Supabase rate limits remain enabled;
this phase does not introduce a production abuse platform.

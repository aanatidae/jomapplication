// Non-destructive demo setup: public credentials, ordinary RLS, no deletes/updates.
// Keep .local/demo-session.json private; it contains a disposable guest session.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, unlink, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
const requireMobile = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const { createClient } = requireMobile('@supabase/supabase-js');
const mode = process.argv[2];
if (process.argv.length !== 3 || !['--check', '--seed'].includes(mode)) {
  console.error('Use --check or --seed; extra arguments and remote reset are not supported.');
  process.exit(1);
}
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
assert(url && key, 'Configure public Supabase environment variables first.');
assert(new URL(url).protocol === 'https:' || new URL(url).hostname === '127.0.0.1', 'Use HTTPS or local Supabase.');
assert(key.startsWith('sb_publishable_') || JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon', 'A public client key is required.');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const statePath = new URL('../.local/demo-session.json', import.meta.url);
const stateDir = new URL('../.local/', import.meta.url);
const lockPath = new URL('../.local/demo-session.lock', import.meta.url);
let lock;
function ok(result, label) {
  assert(!result.error, `${label} failed (${result.error?.code ?? result.error?.status ?? 'request'}). No reset was performed.`);
  return result.data;
}
async function save(state) {
  await mkdir(stateDir, { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2) + '\n', { mode: 0o600 });
}
try {
  await mkdir(stateDir, { recursive: true });
  // Refuse concurrent setup rather than create duplicate anonymous identities.
  lock = await open(lockPath, 'wx', 0o600);
  let state;
  try { state = JSON.parse(await readFile(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!state) {
    assert(mode === '--seed', 'No demo manifest. Run --seed once; --check never creates an identity.');
    const { session, user } = ok(await client.auth.signInAnonymously(), 'Create demo guest');
    assert(session && user, 'No guest session.');
    state = { version: 1, project: url, owner: user.id, session, routeId: randomUUID(), reportId: randomUUID() };
    // Save IDs before inserting, so an interrupted request can be checked safely.
    await save(state);
  } else {
    assert(state.version === 1 && state.project === url, 'Manifest belongs to a different project/version. Preserve it and inspect setup.');
    const { session } = ok(await client.auth.setSession(state.session), 'Restore demo guest');
    assert(session?.user.id === state.owner, 'Demo identity mismatch.');
    state.session = session;
    await save(state);
  }
  const fixtures = [
    ['community_routes', state.routeId, {
      title: 'DEMO · Rehearsal walking route', purpose_tags: ['Walking'],
      notes: 'SIMULATED rehearsal fixture. Community submitted, not verified. Does not change routing.',
      route: { id: 'demo-rehearsal-v1', label: 'SIMULATED schematic fixture', origin: 'Demo transit stop', destination: 'Demo residential block', geometry: [[0.12, 0.57], [0.5, 0.36], [0.88, 0.57]], distanceM: 600, durationMinutes: 8, coordinateSystem: 'schematic_demo' },
    }],
    ['barrier_reports', state.reportId, {
      category: 'blocked_walkway', description: 'SIMULATED rehearsal barrier. Current conditions unknown; not connected to routing.',
      location: { label: 'SIMULATED demo waypoint', coordinateSystem: 'schematic_demo', point: [0.5, 0.36] }, condition_type: 'unknown',
    }],
  ];
  for (const [table, id, payload] of fixtures) {
    let row = ok(await client.from(table).select('*').eq('id', id).maybeSingle(), 'Read demo fixture');
    if (!row && mode === '--seed') {
      row = ok(await client.from(table).insert({ id, user_id: state.owner, ...payload, verification_level: 'community_submitted', published: true }).select('*').single(), 'Insert demo fixture');
      console.log(`Created ${table} demo fixture.`);
    }
    assert(row?.user_id === state.owner && row.published && row.verification_level === 'community_submitted', 'Demo fixture absent or altered; inspect it without overwriting data.');
    assert(Object.entries(payload).every(([field, value]) => isDeepStrictEqual(row[field], value)), 'Demo fixture content changed; inspect it without overwriting data.');
    console.log(`PASS ${table}: persisted, published, Community submitted.`);
  }
  console.log('Demo setup ready. Repeat --seed reuses the same two IDs. No records deleted or overwritten.');
} catch (error) {
  // Do not print Supabase requests, session data, or credentials.
  console.error(error?.code === 'EEXIST'
    ? 'Demo setup is locked. Wait for the running setup. Remove a stale local lock only after confirming no setup process is active.'
    : error instanceof assert.AssertionError ? error.message : 'Demo setup failed. Check connectivity and the private manifest; no remote reset was performed.');
  process.exitCode = 1;
} finally {
  await client.auth.stopAutoRefresh();
  if (lock) { await lock.close(); await unlink(lockPath); }
}

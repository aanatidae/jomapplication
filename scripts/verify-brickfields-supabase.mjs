// Default: read-only validator check. --write-test exercises private, disposable
// geographic rows with two anonymous users and removes only those exact test rows.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const requireMobile = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const { createClient } = requireMobile('@supabase/supabase-js');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL, key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
assert(url && key, 'Configure public Supabase environment variables');
assert(new URL(url).protocol === 'https:' || new URL(url).hostname === '127.0.0.1', 'Use HTTPS or local Supabase');
assert(key.startsWith('sb_publishable_') || JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon', 'Public app key required');
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const points = JSON.parse(readFileSync(new URL('../services/api/data/brickfields/destinations.json', import.meta.url)));
const route = { id: 'brickfields-schema-check', label: 'Geographic validator check', origin: points[0].label,
  destination: points[1].label, geometry: points.slice(0, 2).map(p => [p.longitude, p.latitude]),
  distanceM: 316, durationMinutes: 5, coordinateSystem: 'WGS84' };
const location = { label: points[0].label, coordinateSystem: 'WGS84', point: route.geometry[0] };
for (const [name, value] of [['valid_shared_path', route], ['valid_report_location', location]]) {
  const result = await client.rpc(name, { value });
  assert(!result.error, `${name}: RPC unavailable (${result.error?.code ?? 'unknown'})`);
  console.log(`${name}: geographic snapshots ${result.data === true ? 'accepted' : 'REJECTED — migration required'}`);
  if (result.data !== true) process.exitCode = 1;
}
// Legacy content must remain valid; malformed WGS84 must still be rejected.
const legacy = { ...route, coordinateSystem: 'schematic_demo', geometry: [[0.1, 0.1], [0.5, 0.5]] };
assert.equal((await client.rpc('valid_shared_path', { value: legacy })).data, true, 'Legacy route rejected');
assert.equal((await client.rpc('valid_report_location', { value: { ...location, point: [181, 3] } })).data, false, 'Out-of-range geographic point accepted');

if (process.argv.includes('--write-test')) {
  assert(!process.exitCode, 'Apply the geographic migration before write tests');
  const checked = (result, label) => { assert(!result.error, `${label} failed (${result.error?.code ?? 'unknown'})`); return result.data; };
  const other = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const own = checked(await client.auth.signInAnonymously(), 'First test identity').user.id;
  checked(await other.auth.signInAnonymously(), 'Second test identity');
  const cleanup = [];
  try {
    const api = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';
    const result = await fetch(`${api.replace(/\/$/, '')}/v1/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: { latitude: points[0].latitude, longitude: points[0].longitude }, destination: { latitude: points[1].latitude, longitude: points[1].longitude }, profile: 'fastest' }) });
    assert(result.ok, 'Geographic routing API unavailable for write verification');
    const actual = (await result.json()).routes[0];
    assert.equal(actual.geometry.coordinate_system, 'WGS84');
    const snapshot = { ...route, id: actual.id, geometry: actual.geometry.coordinates, distanceM: actual.distance_m, durationMinutes: Math.ceil(actual.estimated_time_s / 60) };
    const shared = checked(await client.from('community_routes').insert({ user_id: own, title: 'Disposable Brickfields geographic verification', purpose_tags: ['Walking'], route: snapshot, published: false }).select().single(), 'Geographic route insert');
    cleanup.push(['community_routes', shared.id]);
    assert.deepEqual(shared.route.geometry, snapshot.geometry);
    assert.equal(shared.verification_level, 'community_submitted');
    const report = checked(await client.from('barrier_reports').insert({ user_id: own, category: 'blocked_walkway', location: { ...location, routeId: actual.id, waypointIndex: 0 }, description: 'Disposable geographic validation; no real barrier claim.', condition_type: 'temporary', published: false }).select().single(), 'Geographic barrier insert');
    cleanup.push(['barrier_reports', report.id]);
    assert.equal(report.location.coordinateSystem, 'WGS84');
    assert.deepEqual(report.location.point, snapshot.geometry[0]);
    assert.equal(report.verification_level, 'community_submitted');
    assert.equal(Date.parse(report.expires_at) - Date.parse(report.reported_at), 86400000);
    for (const [table, id] of cleanup) {
      const hidden = checked(await other.from(table).select('id').eq('id', id), 'Other user draft visibility');
      assert.equal(hidden.length, 0);
      const attack = checked(await other.from(table).update({ published: true }).eq('id', id).select('id'), 'Other user write rejection');
      assert.equal(attack.length, 0);
      assert((await client.from(table).update({ verification_level: 'verified' }).eq('id', id)).error, 'Verification escalation allowed');
      assert((await client.from(table).update({ verification_level: 'confirmed' }).eq('id', id)).error, 'Confirmation escalation allowed');
    }
    console.log('Geographic route/report persistence, two-user ownership, verification guards and 24-hour expiry PASS (private disposable rows).');
  } finally {
    for (const [table, id] of cleanup.reverse()) checked(await client.from(table).delete().eq('id', id).select('id'), 'Test-row cleanup');
    await client.auth.signOut(); await other.auth.signOut();
    console.log('Exact test rows cleaned; no public content created.');
  }
}

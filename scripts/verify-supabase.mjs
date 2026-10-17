// Run: node --env-file=apps/mobile/.env.local scripts/verify-supabase.mjs
// Uses only public credentials. Logs assertions, never sessions/keys or payloads.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const requireMobile = createRequire(new URL('../apps/mobile/package.json', import.meta.url));
const { createClient } = requireMobile('@supabase/supabase-js');
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
assert(url && key, 'Configure public Supabase environment variables first');
assert(new URL(url).protocol === 'https:' || new URL(url).hostname === '127.0.0.1', 'Use HTTPS or local Supabase');
assert(key.startsWith('sb_publishable_') || JSON.parse(Buffer.from(key.split('.')[1], 'base64url')).role === 'anon', 'Public client key required');
const makeClient = () => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
const clients = [makeClient(), makeClient()];
const publicClient = makeClient();
const created = [];
const bucket = 'jom-community-images';
const paths = [];
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
const route = { id: 'rls-test', label: 'SIMULATED POLICY TEST', origin: 'Demo A', destination: 'Demo B', geometry: [[0.1,0.1],[0.5,0.5]], distanceM: 100, durationMinutes: 2, coordinateSystem: 'schematic_demo' };
function ok(result, label) { assert(!result.error, `${label} failed (${result.error?.code ?? result.error?.statusCode ?? 'request'})`); return result.data; }
function denied(result, label) { assert(result.error || result.data?.length === 0, `${label} unexpectedly allowed`); }
try {
  const identities = [];
  for (const client of clients) {
    const data = ok(await client.auth.signInAnonymously(), 'Anonymous sign-in');
    assert(data.user?.id && data.session, 'Identity/session missing');
    identities.push(data.user.id);
  }
  console.log('Anonymous Supabase authentication verified successfully (two independent users).');
  for (let index = 0; index < 2; index++) {
    const client = clients[index], id = identities[index];
    ok(await client.from('profiles').upsert({ id, prefer_well_lit: true, onboarding_completed: true }), 'Create own profile');
    ok(await client.from('profiles').update({ avoid_stairs: true }).eq('id', id).select().single(), 'Edit own profile');
    assert((await client.from('profiles').insert({ id: identities[1-index] })).error, 'Profile ownership spoof accepted');
    const r = ok(await client.from('community_routes').insert({ user_id: id, title: 'Disposable Phase 9 test', purpose_tags: ['Walking'], route, published: false }).select().single(), 'Create own route');
    created.push({ client, table: 'community_routes', id: r.id });
    assert.equal(r.verification_level, 'community_submitted');
    ok(await client.from('community_routes').update({ notes: 'Owner update' }).eq('id', r.id).select().single(), 'Edit own route');
    const b = ok(await client.from('barrier_reports').insert({ user_id: id, category: 'blocked_walkway', location: { label: 'Demo point', coordinateSystem: 'schematic_demo', point: [0.1,0.1] }, description: 'Disposable policy test', condition_type: 'temporary', published: false }).select().single(), 'Create own report');
    created.push({ client, table: 'barrier_reports', id: b.id });
    assert.equal(b.verification_level, 'community_submitted');
    assert.equal(Date.parse(b.expires_at) - Date.parse(b.reported_at), 86400000);
    ok(await client.from('barrier_reports').update({ description: 'Owner update' }).eq('id', b.id).select().single(), 'Edit own report');
    for (const [table, row] of [['community_routes', r], ['barrier_reports', b]]) {
      const prefix = table === 'community_routes' ? 'community-routes' : 'barrier-reports';
      const path = `${prefix}/${id}/${row.id}/photo.png`;
      paths.push({ client, path });
      ok(await client.storage.from(bucket).upload(path, png, { contentType: 'image/png', upsert: false }), 'Upload owner photo');
      const other = clients[1-index];
      assert((await other.storage.from(bucket).upload(path, png, { contentType: 'image/png', upsert: true })).error, 'Other user overwrite allowed');
      const deleteAttempt = await other.storage.from(bucket).remove([path]);
      assert(deleteAttempt.error || deleteAttempt.data?.length === 0, 'Other user delete allowed');
      assert((await fetch(client.storage.from(bucket).getPublicUrl(path).data.publicUrl)).ok, 'Public image read failed');
      assert((await client.storage.from(bucket).upload(`${prefix}/${id}/${row.id}/photo.txt`, Buffer.from('test'), { contentType: 'text/plain' })).error, 'Document upload accepted');
      ok(await client.from(table).update({ photo_path: path, published: true }).eq('id', row.id).select().single(), 'Publish with photo');
      assert((await client.from(table).update({ verification_level: 'verified' }).eq('id', row.id)).error, 'Verification escalation allowed');
      assert((await client.from(table).update({ user_id: identities[1-index] }).eq('id', row.id)).error, 'Ownership change allowed');
      const attack = table === 'community_routes' ? { user_id: id, title: 'Bad verification', purpose_tags: ['Walking'], route, verification_level: 'verified' } : { user_id: id, category: 'construction', location: b.location, description: 'Bad verification', condition_type: 'unknown', verification_level: 'verified' };
      assert((await client.from(table).insert(attack)).error, 'Verified insert accepted');
      const spoof = { ...attack, user_id: identities[1-index], verification_level: 'community_submitted' };
      assert((await client.from(table).insert(spoof)).error, 'Cross-user ownership insert accepted');
      assert((await publicClient.from(table).insert({ ...attack, verification_level: 'community_submitted' })).error, 'Signed-out write accepted');
      assert((await client.from(table).update({ verification_level: 'confirmed' }).eq('id', row.id)).error, 'Confirmation escalation allowed');
      denied(await other.from(table).update(table === 'community_routes' ? { title: 'Attack' } : { description: 'Attack' }).eq('id', row.id).select(), 'Cross-user update');
      denied(await other.from(table).delete().eq('id', row.id).select(), 'Cross-user delete');
      assert(ok(await publicClient.from(table).select('id').eq('id', row.id), 'Public community read').length === 1);
    }
    denied(await clients[1-index].from('profiles').update({ avoid_stairs: false }).eq('id', id).select(), 'Cross-user profile edit');
    assert.equal(ok(await clients[1-index].from('profiles').select('id').eq('id', id), 'Private profile read').length, 0);
    // Restore the persisted session in a fresh client, as app startup does.
    const session = ok(await client.auth.getSession(), 'Read session').session;
    const restarted = makeClient();
    ok(await restarted.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token }), 'Restore session');
    const profile = ok(await restarted.from('profiles').select('*').eq('id', id).single(), 'Reload preferences');
    assert(profile.avoid_stairs && profile.onboarding_completed);
    await restarted.auth.stopAutoRefresh();
  }
  console.log('PASS: A/B ownership, private profiles, public feed, immutable ownership, verified insert/update rejection, 24h expiry, session restore and preferences reload.');
  console.log('PASS: route/report image uploads, public reads, cross-user overwrite/delete rejection, unsupported MIME rejection.');
} finally {
  for (const { client, path } of paths) ok(await client.storage.from(bucket).remove([path]), 'Cleanup test photo');
  for (const { client, table, id } of created) ok(await client.from(table).delete().eq('id', id), 'Cleanup test row');
  for (const client of clients) {
    const session = (await client.auth.getSession()).data.session;
    if (session) ok(await client.from('profiles').delete().eq('id', session.user.id), 'Cleanup test profile');
    await client.auth.signOut({ scope: 'local' });
  }
  console.log('Temporary test content removed. Anonymous auth identities remain for administrator cleanup.');
}

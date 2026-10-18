// Live HTTP rehearsal. This never changes the graph or a user's preferences.
import assert from 'node:assert/strict';
const base = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(10000) });
assert.equal(health.status, 200);
assert.equal((await health.json()).status, 'ok');
const trip = { origin: { node_id: 'transit_stop' }, destination: { node_id: 'residential_block' } };
async function request(body) {
  return fetch(`${base}/v1/routes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
}
const preferred = [];
for (const [profile, minutes, metres] of [['fastest', 8, 600], ['safer_at_night', 10, 720], ['step_free', 12, 830]]) {
  let previous;
  for (let repeat = 0; repeat < 3; repeat++) {
    const response = await request({ ...trip, profile, preferences: {} });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.data_kind, 'SIMULATED_DEMO');
    assert(payload.routes.length >= 1 && payload.routes.length <= 3);
    const route = payload.routes[0];
    assert.equal(route.profile, profile);
    assert.equal(route.estimated_time_s / 60, minutes);
    assert.equal(route.distance_m, metres);
    assert.equal(route.geometry.coordinate_system, 'local_metres_not_geographic');
    assert.equal(route.geometry.type, 'LineString');
    assert(route.geometry.coordinates.length >= 2);
    assert(route.warnings.some(text => text.includes('SIMULATED')));
    assert(route.data_quality && route.data_quality.last_verified_at === null);
    if (previous) assert.deepEqual(payload, previous);
    previous = payload;
  }
  preferred.push(previous.routes[0]);
  console.log(`PASS ${profile}: ${minutes} min / ${metres} m; identical across three HTTP requests.`);
}
assert.equal(new Set(preferred.map(route => JSON.stringify(route.geometry))).size, 3);
assert(preferred[1].reasons.some(text => text.includes('+2 min')));
assert(preferred[1].reasons.some(text => /lighting/i.test(text)));
assert(preferred[2].reasons.some(text => /stairs|step.free/i.test(text)));
for (const [body, status] of [
  [{ ...trip, profile: 'unsupported' }, 422],
  [{ ...trip, origin: trip.destination, profile: 'fastest' }, 422],
  [{ ...trip, origin: { node_id: 'outside-network' }, profile: 'fastest' }, 404],
  [{ ...trip, profile: 'fastest', preferences: { avoid_stairs: 'yes' } }, 422],
]) assert.equal((await request(body)).status, status);
console.log('PASS health, distinct geometry, truthful demo/unknown-verification metadata and invalid-input HTTP responses.');

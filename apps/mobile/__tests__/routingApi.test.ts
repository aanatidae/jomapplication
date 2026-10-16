import fixtures from './fixtures/routes.json';
import { planRoutes, parseRouteResponse, type RouteRequest } from '../src/services/routingApi';

const request: RouteRequest = { origin: { node_id: 'transit_stop' }, destination: { node_id: 'residential_block' }, profile: 'fastest' };
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; jest.useRealTimers(); });
const respond = (body: unknown, status = 200) => ({ ok: status === 200, status, json: async () => body }) as Response;

it('serializes the exact contract and parses actual backend fixture output', async () => {
  const fetcher = jest.fn().mockResolvedValue(respond(fixtures.fastest)); globalThis.fetch = fetcher;
  expect(await planRoutes(request, { baseUrl: 'http://localhost:8000/' })).toEqual(fixtures.fastest);
  expect(fetcher).toHaveBeenCalledWith('http://localhost:8000/v1/routes', expect.objectContaining({
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request),
  }));
});
it('uses the environment base URL', async () => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000';
  globalThis.fetch = jest.fn().mockResolvedValue(respond(fixtures.fastest));
  await planRoutes(request);
  delete process.env.EXPO_PUBLIC_API_BASE_URL;
});
it.each([null, {}, { ...fixtures.fastest, routes: [{ ...fixtures.fastest.routes[0], geometry: null }] },
  { ...fixtures.fastest, routes: [{ ...fixtures.fastest.routes[0], estimated_time_s: -1 }] },
])('rejects malformed response %#', body => {
  expect(() => parseRouteResponse(body)).toThrow('invalid_response');
});
it('rejects a mismatched response profile', async () => {
  globalThis.fetch = jest.fn().mockResolvedValue(respond(fixtures.step_free));
  await expect(planRoutes(request, { baseUrl: 'http://localhost' })).rejects.toMatchObject({ kind: 'invalid_response' });
});
it.each([[404, 'No route is available for the selected profile.', 'no_route'],
  [404, 'Origin or destination is outside the current pilot network.', 'outside_network'],
  [500, 'internal details', 'server']])('classifies HTTP %s without leaking detail', async (status, detail, kind) => {
  globalThis.fetch = jest.fn().mockResolvedValue(respond({ detail }, Number(status)));
  await expect(planRoutes(request, { baseUrl: 'http://localhost' })).rejects.toMatchObject({ kind, message: kind });
});
it('classifies a network failure', async () => {
  globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('raw socket error'));
  await expect(planRoutes(request, { baseUrl: 'http://localhost' })).rejects.toMatchObject({ kind: 'network' });
});
it('times out explicitly and aborts transport', async () => {
  jest.useFakeTimers();
  globalThis.fetch = jest.fn().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  const pending = planRoutes(request, { baseUrl: 'http://localhost', timeoutMs: 50 });
  const assertion = expect(pending).rejects.toMatchObject({ kind: 'timeout' });
  await jest.advanceTimersByTimeAsync(50); await assertion;
});

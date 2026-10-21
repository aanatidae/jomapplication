import fixture from './fixtures/routes.json';
import { demoClosureId, type RouteOption, type RouteResponse } from '../src/services/routingApi';
import { distance, point, project } from '../src/features/navigation/geometry';
import { NavigationSession, type Fix, type NavigationPorts } from '../src/features/navigation/session';

const route = { ...fixture.fastest.routes[0], geometry: { type: 'LineString', coordinate_system: 'WGS84', coordinates: [[101.686, 3.13], [101.688, 3.13], [101.688, 3.132]] }, distance_m: 444, estimated_time_s: 355 } as RouteOption;
const destination = point(route.geometry.coordinates[2]);
let now: number, listener: (fix: Fix) => void, failure: () => void;
let remove: jest.Mock, headingRemove: jest.Mock, ports: NavigationPorts, session: NavigationSession;
const fix = (longitude = 101.686, latitude = 3.13, accuracy: number | null = 5): Fix => ({ latitude, longitude, accuracy, timestamp: now });
async function send(longitude: number, latitude = 3.13, elapsed = 10000, accuracy: number | null = 5) {
  now += elapsed; listener(fix(longitude, latitude, accuracy)); await Promise.resolve(); await Promise.resolve();
}
beforeEach(() => {
  jest.useFakeTimers(); now = 1000000; remove = jest.fn(); headingRemove = jest.fn();
  ports = {
    permission: jest.fn(async () => true), services: jest.fn(async () => true), current: jest.fn(async () => fix()),
    watch: jest.fn(async (fn, error) => { listener = fn; failure = error; return { remove }; }),
    heading: jest.fn(async update => { update(90); return { remove: headingRemove }; }),
    routes: jest.fn(async () => ({ ...fixture.fastest, data_kind: 'OPENSTREETMAP', routes: [route] }) as RouteResponse), now: () => now,
  };
  session = new NavigationSession(ports);
});
afterEach(() => { session.stop(); jest.useRealTimers(); });

it('applies and clears a demo closure without restarting GPS and rejects a stale detour response', async () => {
  await session.start(route, destination);
  let finish!: (value: RouteResponse) => void;
  (ports.routes as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const pending = session.setDemoClosure(true);
  expect(session.state.routeInvalidated).toBe(true);
  expect(session.state.remainingM).toBeUndefined();
  expect((ports.routes as jest.Mock).mock.calls[0][0].demo_closure).toBe(demoClosureId);
  await session.setDemoClosure(false);
  expect((ports.routes as jest.Mock).mock.calls[1][0].demo_closure).toBeUndefined();
  finish({ routes: [{ ...route, id: 'stale-detour' }] } as RouteResponse); await pending;
  expect(session.state.route?.id).toBe(route.id);
  expect(session.state.routeInvalidated).toBe(false);
  expect(session.state.remainingM).toBeCloseTo(route.distance_m);
  expect(remove).not.toHaveBeenCalled();
  expect(ports.watch).toHaveBeenCalledTimes(1);
});

it('keeps the blocked route invalid after failure and retains the closure for retry', async () => {
  await session.start(route, destination);
  (ports.routes as jest.Mock).mockRejectedValueOnce({ kind: 'no_route' });
  await session.setDemoClosure(true);
  expect(session.state.routeInvalidated).toBe(true);
  expect(session.state.error).toBeDefined();
  await send(101.6861, 3.13, 21000);
  expect(session.state.remainingM).toBeUndefined();
  await session.reroute();
  expect((ports.routes as jest.Mock).mock.calls.at(-1)[0].demo_closure).toBe(demoClosureId);
  expect(session.state.routeInvalidated).toBe(false);
});

it('falls back to planner preview when a closure change has no fresh valid GPS origin', async () => {
  await session.start(route, destination); now += 16000;
  (ports.current as jest.Mock).mockResolvedValueOnce({ ...fix(), timestamp: now - 16000 });
  expect(await session.setDemoClosure(true)).toBe(false);
  expect(session.state.status).toBe('idle'); expect(remove).toHaveBeenCalledTimes(1);
  expect(ports.routes).not.toHaveBeenCalled();
});

it('refreshes a stationary device fix before rerouting without restarting the GPS watcher', async () => {
  await session.start(route, destination); now += 16000;
  expect(await session.setDemoClosure(true)).toBe(true);
  expect(ports.current).toHaveBeenCalledTimes(2);
  expect(session.state.status).toBe('active');
  expect(session.state.routeInvalidated).toBe(false);
  expect(session.state.remainingM).toBeCloseTo(route.distance_m);
  expect(remove).not.toHaveBeenCalled();
});

it('does not revive navigation when Stop happens during a fresh-fix request', async () => {
  await session.start(route, destination); now += 16000;
  let finish!: (fix: Fix) => void;
  (ports.current as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  const pending = session.setDemoClosure(true);
  session.stop(); finish(fix()); await pending;
  expect(session.state.status).toBe('idle');
  expect(ports.routes).not.toHaveBeenCalled();
});

it('projects onto the network polyline, rather than straight-line distance to destination', () => {
  const p = project(fix(), route.geometry.coordinates);
  expect(p.remaining).toBeGreaterThan(distance(fix(), destination) * 1.3);
  expect(p.along).toBeCloseTo(0); expect(p.deviation).toBeCloseTo(0);
  expect(project(fix(101.687), route.geometry.coordinates).along).toBeGreaterThan(100);
});
it('starts one watcher, receives real callback coordinates, updates ETA and stops both subscriptions', async () => {
  await session.start(route, destination); await session.start(route, destination);
  expect(ports.watch).toHaveBeenCalledTimes(1); expect(session.state.heading).toBe(90);
  const before = session.state.remainingS!;
  await send(101.6863);
  expect(session.state.position?.longitude).toBe(101.6863);
  expect(session.state.remainingS).toBeLessThan(before);
  session.stop(); expect(remove).toHaveBeenCalledTimes(1); expect(headingRemove).toHaveBeenCalledTimes(1);
  listener(fix(101.687)); expect(session.state.status).toBe('idle'); expect(session.state.position).toBeUndefined();
});
it('lets manual exploration suspend following and Recenter restore it', async () => {
  await session.start(route, destination); session.explore(); expect(session.state.following).toBe(false);
  await send(101.6861); expect(session.state.following).toBe(false);
  session.recenter(); expect(session.state.following).toBe(true);
});
it.each(['denied', 'disabled', 'gps'] as const)('handles %s before tracking starts', async mode => {
  if (mode === 'denied') ports.permission = async () => false;
  if (mode === 'disabled') ports.services = async () => false;
  if (mode === 'gps') ports.current = async () => { throw new Error('Location signal unavailable.'); };
  await session.start(route, destination); expect(session.state.status).toBe('idle'); expect(session.state.error).toMatch(/Location/);
  expect(ports.watch).not.toHaveBeenCalled();
});
it('rejects coarse-only, null-accuracy, stale and out-of-order updates without advancing', async () => {
  await session.start(route, destination); const before = session.state.progress;
  await send(101.687, 3.13, 10000, 100); await send(101.687, 3.13, 10000, null);
  listener({ ...fix(101.687), timestamp: now - 60000 });
  expect(session.state.progress).toBe(before); expect(ports.routes).not.toHaveBeenCalled();
});
it('ignores a single GPS jump and a single off-route fix', async () => {
  await session.start(route, destination);
  await send(101.7, 3.14, 1000); expect(session.state.position?.longitude).toBe(101.686);
  await send(101.686, 3.1305, 30000); await send(101.6861, 3.13, 20000);
  expect(ports.routes).not.toHaveBeenCalled(); expect(session.state.warning).toBeUndefined();
});
it('debounces deviation, reroutes with the same profile/preferences, and throttles failure retries', async () => {
  const night = { ...route, profile: 'safer_at_night' } as RouteOption;
  await session.start(night, destination, { prefer_public_areas: true });
  (ports.routes as jest.Mock).mockRejectedValue({ kind: 'network' });
  await send(101.686, 3.1306, 30000); await send(101.686, 3.1306, 3000); await send(101.686, 3.1306, 3000);
  expect(ports.routes).toHaveBeenCalledTimes(1);
  const request = (ports.routes as jest.Mock).mock.calls[0][0];
  expect(request.profile).toBe('safer_at_night'); expect(request.preferences).toEqual({ prefer_public_areas: true });
  expect(request.origin.latitude).toBe(3.1306); expect(session.state.error).toContain('preserved');
  await session.reroute(); expect(ports.routes).toHaveBeenCalledTimes(1);
  now += 20000; listener(fix(101.686, 3.1306)); await session.reroute(); expect(ports.routes).toHaveBeenCalledTimes(2);
});
it('accepts a successful reroute and rejects a backend profile substitution', async () => {
  await session.start(route, destination);
  const updated = { ...route, id: 'rerouted', geometry: { ...route.geometry, coordinates: [[101.686, 3.1306], [101.688, 3.13], [101.688, 3.132]] as [number, number][] } };
  (ports.routes as jest.Mock).mockResolvedValueOnce({ routes: [updated] });
  await send(101.686, 3.1306, 30000); await session.reroute();
  expect(session.state.route?.id).toBe('rerouted'); expect(session.state.rerouting).toBe(false);
  now += 21000; listener(fix(101.686, 3.1306));
  (ports.routes as jest.Mock).mockResolvedValueOnce({ routes: [{ ...updated, profile: 'step_free' }] });
  await session.reroute(); expect(session.state.route?.profile).toBe('fastest'); expect(session.state.error).toBeTruthy();
});
it('invalidates a pending Start when stopped, including a late watcher installation', async () => {
  let finish!: (value: { remove: jest.Mock }) => void;
  ports.watch = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  const starting = session.start(route, destination); await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  session.stop(); finish({ remove }); await starting;
  expect(remove).toHaveBeenCalledTimes(1); expect(session.state.status).toBe('idle');
});
it('cancels pending permission and cannot resurrect navigation on completion', async () => {
  let finish!: (value: boolean) => void;
  ports.permission = () => new Promise(resolve => { finish = resolve; });
  const starting = session.start(route, destination); session.stop(); finish(true); await starting;
  expect(ports.watch).not.toHaveBeenCalled(); expect(session.state.status).toBe('idle');
});
it('aborts a pending reroute and ignores stale success after Stop', async () => {
  await session.start(route, destination);
  let finish!: (value: { routes: RouteOption[] }) => void;
  (ports.routes as jest.Mock).mockImplementation((_request, options) => new Promise(resolve => { finish = resolve; }));
  const recalculation = session.reroute(); const signal = (ports.routes as jest.Mock).mock.calls[0][1].signal;
  session.stop(); expect(signal.aborted).toBe(true); finish({ routes: [route] }); await recalculation;
  expect(session.state.status).toBe('idle'); expect(session.state.route).toBeUndefined();
});
it('pauses all resources in background and resumes with exactly one new watcher', async () => {
  await session.start(route, destination); session.pause(); expect(remove).toHaveBeenCalledTimes(1);
  expect(session.state.status).toBe('paused'); await session.resume(); expect(ports.watch).toHaveBeenCalledTimes(2);
  expect(session.state.status).toBe('active');
});
it('reports a lost/error signal and restores progress only from a fresh fix', async () => {
  await session.start(route, destination); failure(); expect(session.state.warning).toContain('signal unavailable');
  now += 21000; jest.advanceTimersByTime(5000); expect(session.state.warning).toContain('No recent location');
  await send(101.6861); expect(session.state.warning).toBeUndefined();
});
it('requires confident repeated arrival at both the route end and chosen destination, then disposes', async () => {
  await session.start(route, destination);
  await send(101.688, 3.132, 120000); expect(session.state.status).toBe('active');
  await send(101.688, 3.132, 3000); expect(session.state.status).toBe('arrived'); expect(remove).toHaveBeenCalledTimes(1);
  expect(session.state.remainingM).toBe(0);
});
it('does not arrive near a snapped endpoint if the actual destination is farther away', async () => {
  await session.start(route, { ...destination, latitude: destination.latitude + 0.001 });
  await send(101.688, 3.132, 120000); await send(101.688, 3.132, 3000);
  expect(session.state.status).toBe('active');
});
it('does not jump along a hairpin or arrive because GPS drifts onto an adjacent return segment', async () => {
  const hairpin = { ...route, geometry: { ...route.geometry, coordinates: [[101.686, 3.13], [101.688, 3.13], [101.688, 3.13003], [101.686, 3.13003]] as [number, number][] } };
  await session.start(hairpin, point(hairpin.geometry.coordinates[3]));
  await send(101.686, 3.13004, 3000); await send(101.686, 3.13005, 3000);
  expect(session.state.status).toBe('active'); expect(session.state.remainingM).toBe(444);
  expect(session.state.warning).toContain('ambiguous');
});

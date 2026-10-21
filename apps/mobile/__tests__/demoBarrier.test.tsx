import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import fixture from './fixtures/routes.json';
import { PlannerScreen } from '../src/features/planner/PlannerScreen';
import { barrierRepository } from '../src/features/barriers/repository';
import { demoClosureId, type RouteOption } from '../src/services/routingApi';

const crossing = { id: demoClosureId, label: 'NU Sentral crossing · OSM 1264710459', latitude: 3.1336672, longitude: 101.6884742 };
const normal: RouteOption = { ...fixture.fastest.routes[0], id: 'original',
  profile: 'fastest', confidence: { ...fixture.fastest.routes[0].confidence, level: 'Low' },
  geometry: { type: 'LineString', coordinate_system: 'WGS84', coordinates: [[101.687547, 3.1331516], [101.6884742, 3.1336672], [101.6906217, 3.1318006]] },
  distance_m: 468.7688498, estimated_time_s: 375.0151,
};
const detour: RouteOption = { ...normal, id: 'detour', distance_m: 515.3131166, estimated_time_s: 412.2505,
  geometry: { ...normal.geometry, coordinates: [[101.687547, 3.1331516], [101.688, 3.134], [101.6906217, 3.1318006]] },
};
const originalFetch = globalThis.fetch;
let remove: jest.Mock;
beforeEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000';
  remove = jest.fn();
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
  jest.mocked(Location.getCurrentPositionAsync).mockImplementation(async () => ({ timestamp: Date.now(), coords: { latitude: 3.1331516, longitude: 101.687547, accuracy: 5 } }) as Location.LocationObject);
  jest.mocked(Location.watchPositionAsync).mockResolvedValue({ remove });
  jest.spyOn(barrierRepository, 'createReport');
  globalThis.fetch = jest.fn(async (url: Parameters<typeof fetch>[0], options?: RequestInit) => ({ ok: true, json: async () => String(url).endsWith('/v1/demo-crossing') ? crossing : ({
    ...fixture.fastest, data_kind: 'OPENSTREETMAP', routes: [JSON.parse(String(options?.body)).demo_closure ? detour : normal],
  }) })) as unknown as typeof fetch;
});
afterEach(() => { globalThis.fetch = originalFetch; jest.restoreAllMocks(); });

async function report() {
  fireEvent.press(screen.getByRole('button', { name: 'Report Barrier' }));
  fireEvent.press(screen.getByRole('button', { name: 'Report a demo crossing blockage' }));
  await screen.findByText('Crossing blockage demo');
  fireEvent.press(screen.getByRole('radio', { name: 'Blocked pedestrian crossing' }));
  fireEvent.press(screen.getByRole('radio', { name: crossing.label }));
  fireEvent.changeText(screen.getByLabelText('Description (optional)'), 'Demo only');
  fireEvent.press(screen.getByRole('button', { name: 'Confirm demo report' }));
  await screen.findByText('Demo report recorded · unverified');
  expect(barrierRepository.createReport).not.toHaveBeenCalled();
}
const blockedMap = () => screen.queryByLabelText(/Interactive geographic map.*Simulated blocked pedestrian crossing/);

it('reports without expanding, explicitly activates, marks the crossing, reroutes, clears and repeats', async () => {
  render(<PlannerScreen/>); await screen.findByText('469 m');
  for (let pass = 0; pass < 2; pass++) {
    expect(blockedMap()).toBeNull();
    await report();
    expect(blockedMap()).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Activate simulated closure' }));
    await screen.findByText('515 m');
    expect(blockedMap()).toBeTruthy();
    expect(screen.getByText('Demo blockage active — alternative route calculated')).toBeTruthy();
    expect(screen.getByText('515 m · 6 min 52 sec walking · no waiting')).toBeTruthy();
    expect(JSON.parse(jest.mocked(fetch).mock.calls.at(-1)![1]!.body as string).demo_closure).toBe(demoClosureId);
    fireEvent.press(screen.getByRole('button', { name: 'Clear demo blockage' }));
    await screen.findByText('469 m');
    expect(blockedMap()).toBeNull();
    expect(screen.queryByText(/Demo blockage active/)).toBeNull();
  }
  expect(barrierRepository.createReport).not.toHaveBeenCalled();
});

it('keeps GPS navigation running while opening, closing and submitting the in-place demo', async () => {
  render(<PlannerScreen/>); await screen.findByText('469 m');
  fireEvent.press(screen.getByRole('button', { name: 'Start navigation' }));
  await screen.findByText('469 m · 7 min left');
  fireEvent.press(screen.getByRole('button', { name: 'Report Barrier' }));
  fireEvent.press(screen.getByRole('button', { name: 'Return to map' }));
  expect(remove).not.toHaveBeenCalled();
  await report();
  const routeCallsBefore = jest.mocked(fetch).mock.calls.filter(([, options]) => options?.body).length;
  fireEvent.press(screen.getByRole('button', { name: 'Activate simulated closure' }));
  await screen.findByText('515 m · 7 min left');
  expect(remove).not.toHaveBeenCalled();
  expect(blockedMap()).toBeTruthy();
  const requests = jest.mocked(fetch).mock.calls.filter(([, options]) => options?.body).map(([, options]) => JSON.parse(options!.body as string));
  expect(requests).toContainEqual(expect.objectContaining({ demo_closure: demoClosureId, origin: { latitude: 3.1331516, longitude: 101.687547 } }));
  expect(requests).toHaveLength(routeCallsBefore + 1); // No competing Planner preview request.
  fireEvent.press(screen.getByRole('button', { name: 'Clear demo blockage' }));
  await screen.findByText('469 m · 7 min left');
  expect(remove).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Stop Navigation' }));
  expect(remove).toHaveBeenCalledTimes(1);
  await screen.findByText('469 m');
});

it('hides the original route when closure recalculation fails and clears the failure on reset', async () => {
  const fetcher = globalThis.fetch;
  globalThis.fetch = jest.fn(async (url: Parameters<typeof fetch>[0], options?: RequestInit) => {
    if (options?.body && JSON.parse(String(options.body)).demo_closure) return { ok: false, status: 404, json: async () => ({ detail: 'No suitable mapped pedestrian alternative' }) } as Response;
    return fetcher(url, options);
  }) as unknown as typeof fetch;
  render(<PlannerScreen/>); await screen.findByText('469 m'); await report();
  fireEvent.press(screen.getByRole('button', { name: 'Activate simulated closure' }));
  await screen.findByText('Demo blockage active — no suitable alternative available. Retry or clear the simulation.');
  expect(screen.queryByText('469 m')).toBeNull(); expect(blockedMap()).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Clear demo blockage' }));
  await screen.findByText('469 m');
});

it('ignores a delayed normal planner response after closure activation', async () => {
  const fetcher = globalThis.fetch;
  let finish!: (value: Response) => void;
  globalThis.fetch = jest.fn((url: Parameters<typeof fetch>[0], options?: RequestInit) => {
    if (String(url).endsWith('/v1/routes') && !JSON.parse(String(options?.body)).demo_closure) return new Promise<Response>(resolve => { finish = resolve; });
    return fetcher(url, options);
  }) as unknown as typeof fetch;
  render(<PlannerScreen/>);
  await waitFor(() => expect(finish).toBeDefined()); await report();
  fireEvent.press(screen.getByRole('button', { name: 'Activate simulated closure' }));
  await screen.findByText('515 m');
  await act(async () => finish({ ok: true, json: async () => ({ ...fixture.fastest, data_kind: 'OPENSTREETMAP', routes: [normal] }) } as Response));
  expect(screen.getByText('515 m')).toBeTruthy(); expect(screen.queryByText('469 m')).toBeNull();
});

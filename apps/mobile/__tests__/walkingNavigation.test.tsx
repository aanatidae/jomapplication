import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { AppState, type AppStateStatus } from 'react-native';
import * as ReactNative from 'react-native';
import fixture from './fixtures/routes.json';
import { PlannerScreen } from '../src/features/planner/PlannerScreen';
import { NavigationGuidance, NavigationProgress } from '../src/features/navigation/NavigationPanels';
import type { NavigationState } from '../src/features/navigation/session';

const originalFetch = globalThis.fetch;
const first = { longitude: 101.6867582, latitude: 3.1337503 };
const route = { ...fixture.fastest.routes[0], geometry: { type: 'LineString', coordinate_system: 'WGS84', coordinates: [[first.longitude, first.latitude], [101.6875, first.latitude], [101.687547, 3.1331516]] }, distance_m: 150, estimated_time_s: 120 };
let update: Location.LocationCallback;
let remove: jest.Mock;
const reading = (longitude = first.longitude, latitude = first.latitude, timestamp = Date.now()): Location.LocationObject => ({
  timestamp, coords: { longitude, latitude, accuracy: 5, altitude: null, altitudeAccuracy: null, heading: null, speed: null },
});
beforeEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000';
  globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ ...fixture.fastest, data_kind: 'OPENSTREETMAP', routes: [route] }) })) as unknown as typeof fetch;
  remove = jest.fn();
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
  jest.mocked(Location.hasServicesEnabledAsync).mockResolvedValue(true);
  jest.mocked(Location.getCurrentPositionAsync).mockImplementation(async () => reading());
  jest.mocked(Location.watchPositionAsync).mockImplementation(async (_options, callback) => { update = callback; return { remove }; });
});
afterEach(() => { globalThis.fetch = originalFetch; jest.restoreAllMocks(); delete process.env.EXPO_PUBLIC_API_BASE_URL; });

it('previews before Start, installs a real watcher, updates progress, supports manual exploration/Recenter and Stop', async () => {
  render(<PlannerScreen/>); await screen.findByText('Fastest walk');
  expect(screen.queryByRole('button', { name: 'Stop Navigation' })).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Start navigation' }));
  await screen.findByText('150 m · 2 min left');
  expect(Location.watchPositionAsync).toHaveBeenLastCalledWith(expect.objectContaining({ accuracy: 4, timeInterval: 3000, distanceInterval: 2 }), expect.any(Function), expect.any(Function));
  await act(async () => update(reading(101.6868582, first.latitude, Date.now() + 1500)));
  expect(screen.queryByText('150 m · 2 min left')).toBeNull();
  fireEvent(screen.getByTestId('leaflet-map'), 'message', { nativeEvent: { data: JSON.stringify({ type: 'explore' }) } });
  fireEvent.press(screen.getByRole('button', { name: 'Recenter' }));
  expect(screen.getByRole('button', { name: 'Following your location' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Stop Navigation' }));
  expect(remove).toHaveBeenCalledTimes(1); await screen.findByRole('button', { name: 'Start navigation' });
});
it('shows permission denial and keeps manual planning available', async () => {
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ granted: false } as Location.LocationPermissionResponse);
  render(<PlannerScreen/>); await screen.findByText('Fastest walk');
  fireEvent.press(screen.getByRole('button', { name: 'Start navigation' }));
  await screen.findByText(/Location permission denied/); expect(screen.getByRole('button', { name: /From/ })).toBeTruthy();
});
it('starts and stops foreground navigation with MCKL selected', async () => {
  const label = 'Methodist College Kuala Lumpur (MCKL) · mapped approach';
  render(<PlannerScreen/>); await screen.findByText('Fastest walk');
  fireEvent.press(screen.getByRole('button', { name: 'To · NU Sentral · main entrance' }));
  fireEvent.press(screen.getByRole('button', { name: label }));
  await screen.findByText('Fastest walk');
  fireEvent.press(screen.getByRole('button', { name: 'Start navigation' }));
  await screen.findByText('150 m · 2 min left');
  expect(screen.getByText(label)).toBeTruthy();
  expect(Location.watchPositionAsync).toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Stop Navigation' }));
  expect(remove).toHaveBeenCalledTimes(1);
  await screen.findByRole('button', { name: `To · ${label}` });
});
it('cleans subscriptions when Planner unmounts', async () => {
  const view = render(<PlannerScreen/>); await screen.findByText('Fastest walk');
  fireEvent.press(screen.getByRole('button', { name: 'Start navigation' })); await screen.findByText('150 m · 2 min left');
  view.unmount(); expect(remove).toHaveBeenCalledTimes(1);
});
it('pauses in background and resumes through the normal watcher API', async () => {
  const changes = new Set<(state: AppStateStatus) => void>();
  const change = (state: AppStateStatus) => changes.forEach(listener => listener(state));
  jest.spyOn(AppState, 'addEventListener').mockImplementation((event, listener) => {
    if (event === 'change') changes.add(listener as (state: AppStateStatus) => void);
    return { remove: () => changes.delete(listener as (state: AppStateStatus) => void) };
  });
  render(<PlannerScreen/>); await screen.findByText('Fastest walk');
  fireEvent.press(screen.getByRole('button', { name: 'Start navigation' })); await screen.findByText('150 m · 2 min left');
  act(() => change('background')); expect(screen.getByText('Navigation paused')).toBeTruthy(); expect(remove).toHaveBeenCalledTimes(1);
  await act(async () => change('active')); await waitFor(() => expect(screen.getByText('Follow the route')).toBeTruthy());
});
it('renders long guidance, rerouting errors, paused GPS, arrival and reachable Stop controls', () => {
  const state: NavigationState = { status: 'active', following: false, rerouting: true, remainingM: 99, remainingS: 90,
    warning: 'Location signal unavailable. Wait for a fresh reading.', error: 'No step-free route could be verified. Your selected profile has been preserved.' };
  const stop = jest.fn(), retry = jest.fn();
  render(<><NavigationGuidance state={state} destination="Buddhist Maha Vihara · accessible entrance beside the community visitor information centre, Brickfields, Kuala Lumpur"/>
    <NavigationProgress state={state} onStop={stop} onRetry={retry} onResume={() => {}}/></>);
  expect(screen.getByText('Recalculating route')).toBeTruthy(); expect(screen.getByText(state.error!)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Stop Navigation' })); expect(stop).toHaveBeenCalledTimes(1);
});
it('shows measured walking progress and does not invent progress before a GPS projection', () => {
  const base: NavigationState = { status: 'active', following: true, rerouting: false };
  const props = { onStop: jest.fn(), onResume: jest.fn(), onRetry: jest.fn() };
  const view = render(<NavigationProgress {...props} state={base}/>);
  expect(screen.queryByRole('progressbar')).toBeNull();
  view.rerender(<NavigationProgress {...props} state={{ ...base, remainingM: 150, remainingS: 120,
    progress: { along: 50, total: 200, remaining: 150, deviation: 1, segment: 0, coordinate: [101.6868, 3.1337] } }}/>);
  expect(screen.getByRole('progressbar', { name: 'Walk progress' }).props.accessibilityValue.now).toBe(25);
  view.rerender(<NavigationProgress {...props} state={{ ...base, status: 'arrived' }}/>);
  expect(screen.getByRole('progressbar').props.accessibilityValue.now).toBe(100);
  expect(screen.getByRole('button', { name: 'Return to Planner' })).toBeTruthy();
});

it('keeps full destination, metrics and essential actions available with large text on a small screen', () => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 320, height: 640, scale: 1, fontScale: 2 });
  const destination = 'Methodist College Kuala Lumpur (MCKL) · mapped approach';
  const onReport = jest.fn();
  const state: NavigationState = { status: 'active', following: true, rerouting: false,
    remainingM: 450, remainingS: 360, position: { ...first, accuracy: 5, timestamp: Date.now() } };
  render(<><NavigationGuidance state={state} destination={destination}/>
    <NavigationProgress state={state} onStop={jest.fn()} onResume={jest.fn()} onRetry={jest.fn()} onReport={onReport}/></>);
  expect(screen.getByText(destination).props.numberOfLines).toBeUndefined();
  const toggle = screen.getByRole('button', { name: `Destination: ${destination}` });
  fireEvent.press(toggle);
  expect(toggle.props.accessibilityState.expanded).toBe(true);
  expect(screen.getByText('450 m · 6 min left')).toBeTruthy();
  expect(screen.getByText('Location accuracy ±5 m')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Stop Navigation' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Report Barrier' }));
  expect(onReport).toHaveBeenCalledTimes(1);
});
it('keeps accuracy and Stop visible while route caveats expand independently', () => {
  const state: NavigationState = { status: 'active', following: true, rerouting: false,
    route: route as unknown as NavigationState['route'], remainingM: 150, remainingS: 120,
    position: { ...first, accuracy: 5, timestamp: Date.now() } };
  render(<NavigationProgress state={state} onStop={jest.fn()} onResume={jest.fn()} onRetry={jest.fn()}/>);
  expect(screen.getByText('Location accuracy ±5 m')).toBeTruthy();
  expect(screen.queryByText(/Turn-by-turn instructions unavailable/)).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Walking details' }));
  expect(screen.getByRole('button', { name: 'Hide walking details' }).props.accessibilityState.expanded).toBe(true);
  expect(screen.getByText(/Turn-by-turn instructions unavailable/)).toBeTruthy();
  for (const warning of route.warnings) expect(screen.getByText(warning)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Stop Navigation' })).toBeTruthy();
});

it('uses device time for arrival and withholds arrival for stale GPS without changing the fix', () => {
  const now = Date.now();
  const state: NavigationState = { status: 'active', following: true, rerouting: false, remainingM: 150, remainingS: 120,
    position: { ...first, accuracy: 5, timestamp: now - 14000 } };
  const props = { onStop: jest.fn(), onResume: jest.fn(), onRetry: jest.fn() };
  const view = render(<NavigationProgress {...props} state={state} now={now}/>);
  const expected = new Date(now + 120000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  expect(screen.getByText(`Estimated arrival ${expected}`)).toBeTruthy();
  view.rerender(<NavigationProgress {...props} state={state} now={now + 600000}/>);
  expect(screen.queryByText(/Estimated arrival/)).toBeNull();
  expect(screen.getByText('Arrival waits for reliable GPS')).toBeTruthy();
  expect(state.position!.timestamp).toBe(now - 14000);
});

it('keeps a location warning compact and exposes its full message on demand', () => {
  jest.spyOn(ReactNative, 'useWindowDimensions').mockReturnValue({ width: 411, height: 800, scale: 1, fontScale: 1 });
  const warning = 'No recent location update. You may be stationary or the GPS signal may be unavailable. Progress and arrival wait for a fresh reading.';
  render(<NavigationGuidance state={{ status: 'active', following: true, rerouting: false, warning }} destination="MCKL · mapped approach"/>);
  expect(screen.queryByText(warning)).toBeNull();
  const toggle = screen.getByRole('button', { name: `Location warning: ${warning}` });
  fireEvent.press(toggle);
  expect(screen.getByText(warning)).toBeTruthy();
  expect(toggle.props.accessibilityState.expanded).toBe(true);
});
it('shows insufficient Night evidence without enabling Start or substituting Fastest', async () => {
  render(<PlannerScreen/>); await screen.findByText('Fastest walk');
  jest.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({ detail: 'Insufficient lighting, crossing and activity information to recommend a safer night route.' }) } as Response);
  fireEvent.press(screen.getByRole('radio', { name: 'Safer at Night' }));
  await screen.findByText(/Insufficient lighting, crossing and activity information/);
  expect(screen.getByRole('radio', { name: 'Safer at Night' }).props.accessibilityState.checked).toBe(true);
  expect(screen.getByRole('button', { name: 'Start navigation' }).props.accessibilityState.disabled).toBe(true);
  expect(screen.getByRole('image').props.accessibilityLabel).toContain('No route is displayed');
});

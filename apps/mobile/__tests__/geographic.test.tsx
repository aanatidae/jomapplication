import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { PlannerScreen } from '../src/features/planner/PlannerScreen';
import { GeographicMap } from '../src/features/planner/GeographicMap';
import { parseRouteResponse, type RouteResponse } from '../src/services/routingApi';
import { toDisplayRoutes } from '../src/features/planner/routePresentation';
import { scriptJson } from '../src/features/planner/leafletDocument';
import { routeLocations } from '../src/features/barriers/model';
import { validateBarrier } from '../src/features/barriers/localRepository';
import { defaultPreferences } from '../src/features/preferences/model';
import { getCurrentOrigin } from '../src/services/currentLocation';
import fixtures from './fixtures/routes.json';

const simulatedFixture = parseRouteResponse(fixtures.fastest);
const response: RouteResponse = {
  ...simulatedFixture, data_kind: 'OPENSTREETMAP', dataset_id: 'brickfields_osm_v1',
  routes: simulatedFixture.routes.slice(0, 1).map(route => ({ ...route, profile: 'fastest',
    geometry: { type: 'LineString', coordinate_system: 'WGS84',
      coordinates: [[101.6867582, 3.1337503], [101.687, 3.1336], [101.687547, 3.1331516]] },
  })),
};
const originalFetch = globalThis.fetch;
beforeEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000';
  globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => response })) as unknown as typeof fetch;
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ granted: false } as Location.LocationPermissionResponse);
});
afterEach(() => { globalThis.fetch = originalFetch; jest.clearAllMocks(); });

it('preserves longitude/latitude geometry without schematic projection', () => {
  expect(toDisplayRoutes(parseRouteResponse(response).routes)[0].geometry).toEqual(response.routes[0].geometry.coordinates);
  expect(() => parseRouteResponse({ ...response, routes: [{ ...response.routes[0], geometry: { ...response.routes[0].geometry, coordinates: [[181, 3], [101, 3]] } }] })).toThrow('invalid_response');
  expect(scriptJson('</script>\u2028')).not.toContain('<');
});

it('does not ask for location until requested and keeps manual selection after denial', async () => {
  render(<PlannerScreen/>); await screen.findByText('Fastest · Option 1');
  expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'Use current location' }));
  await screen.findByText('Location permission denied. Choose a start place or select a start on the map.');
  expect(Location.getCurrentPositionAsync).not.toHaveBeenCalled();
  fireEvent.press(screen.getByRole('button', { name: 'From · KL Sentral · south entrance' }));
  fireEvent.press(screen.getByRole('button', { name: 'Little India · mapped approach' }));
  await waitFor(() => expect(JSON.parse(jest.mocked(fetch).mock.calls.at(-1)![1]!.body as string).origin).toEqual({ latitude: 3.1289663, longitude: 101.6839915 }));
});

it('uses granted GPS coordinates as the origin', async () => {
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
  jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({ coords: { latitude: 3.1335, longitude: 101.6868 } } as Location.LocationObject);
  render(<PlannerScreen/>); await screen.findByText('Fastest · Option 1');
  fireEvent.press(screen.getByRole('button', { name: 'Use current location' }));
  await screen.findByText('Current location selected. Check the mapped route start.');
  expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false });
  await waitFor(() => expect(JSON.parse(jest.mocked(fetch).mock.calls.at(-1)![1]!.body as string).origin).toEqual({ latitude: 3.1335, longitude: 101.6868 }));
});

it('releases the location request when GPS never resolves', async () => {
  jest.useFakeTimers();
  jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({ granted: true } as Location.LocationPermissionResponse);
  jest.mocked(Location.getCurrentPositionAsync).mockImplementation(() => new Promise(() => {}));
  const pending = expect(getCurrentOrigin()).rejects.toThrow('unavailable');
  await jest.advanceTimersByTimeAsync(15000);
  await pending;
  jest.useRealTimers();
});

it('routes a map-selected destination and ignores malformed bridge coordinates', async () => {
  render(<PlannerScreen/>); await screen.findByText('Fastest · Option 1');
  fireEvent.press(screen.getByRole('button', { name: 'Compare 1 route' }));
  fireEvent.press(screen.getByRole('button', { name: 'Set destination on map' }));
  fireEvent(screen.getByTestId('leaflet-map'), 'message', { nativeEvent: { data: JSON.stringify({ type: 'pick', latitude: 3.1305, longitude: 101.6857 }) } });
  await waitFor(() => expect(JSON.parse(jest.mocked(fetch).mock.calls.at(-1)![1]!.body as string).destination).toEqual({ latitude: 3.1305, longitude: 101.6857 }));
  expect(screen.queryByText('Cancel map selection')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Set start on map' }));
  const count = jest.mocked(fetch).mock.calls.length;
  fireEvent(screen.getByTestId('leaflet-map'), 'message', { nativeEvent: { data: '{"type":"pick","latitude":91,"longitude":101}' } });
  expect(jest.mocked(fetch).mock.calls).toHaveLength(count);
});

it('shows tile failure with retry while preserving map controls and attribution', async () => {
  render(<GeographicMap selected="" origin="KL Sentral" destination="NU Sentral"/>);
  fireEvent(screen.getByTestId('leaflet-map'), 'message', { nativeEvent: { data: '{"type":"tile_error"}' } });
  expect(screen.getByText(/Map tiles unavailable/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retry map' })).toBeTruthy();
  expect(screen.getByText(/© OpenStreetMap contributors/)).toBeTruthy();
  await act(async () => fireEvent(screen.getByTestId('leaflet-map'), 'message', { nativeEvent: { data: '{"type":"tile_loaded"}' } }));
  expect(screen.queryByText(/Map tiles unavailable/)).toBeNull();
});

it('preserves WGS84 route locations for unverified barrier reports', () => {
  const route = toDisplayRoutes(response.routes)[0];
  const location = routeLocations({ id: route.id, label: route.mode, origin: 'KL Sentral', destination: 'NU Sentral', geometry: route.geometry, coordinateSystem: 'WGS84', distanceM: route.distance, durationMinutes: route.minutes })[0];
  expect(location.point).toEqual(response.routes[0].geometry.coordinates[0]);
  expect(location.coordinateSystem).toBe('WGS84');
  expect(validateBarrier({ category: 'construction', location, description: 'Construction at this map point', conditionType: 'temporary' })).toEqual({});
  expect(defaultPreferences.avoidStairs).toBe(false);
});

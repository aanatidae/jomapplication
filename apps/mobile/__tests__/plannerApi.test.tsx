import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import fixtures from './fixtures/routes.json';
import { PlannerScreen } from '../src/features/planner/PlannerScreen';
import type { RouteRequest, RouteResponse } from '../src/services/routingApi';

const originalFetch = globalThis.fetch;
let fetcher: jest.Mock;
beforeEach(() => {
  process.env.EXPO_PUBLIC_API_BASE_URL = 'http://localhost:8000';
  fetcher = jest.fn().mockImplementation((_url, init) => {
    const request = JSON.parse(init.body) as RouteRequest;
    return Promise.resolve({ ok: true, status: 200, json: async () => fixtures[request.profile] });
  });
  globalThis.fetch = fetcher;
});
afterEach(() => { globalThis.fetch = originalFetch; delete process.env.EXPO_PUBLIC_API_BASE_URL; jest.restoreAllMocks(); });

it('loads API cards, changes profile requests, caches results and selects an alternative on the map', async () => {
  render(<PlannerScreen />);
  expect(screen.getByRole('progressbar')).toBeTruthy();
  await screen.findByText('Fastest · Option 1');
  expect(screen.getAllByText('600 m').length).toBeGreaterThan(0);
  fireEvent.press(screen.getByRole('button', { name: 'Compare 3 routes' }));
  const options = within(screen.getByLabelText('Route options')).getAllByRole('radio');
  fireEvent.press(options[1]);
  expect(screen.getByRole('image').props.accessibilityLabel).toContain('Selected Fastest · Option 2');
  expect(within(screen.getByLabelText('Route options')).getAllByRole('radio')[0].props.accessibilityState.checked).toBe(true);
  for (const [profile, label, eta] of [['safer_at_night', 'Safer at Night', '10 min'], ['step_free', 'Step-Free', '12 min']] as const) {
    fireEvent.press(screen.getByRole('radio', { name: label }));
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByRole('image').props.accessibilityLabel).toContain('No route is displayed');
    await screen.findByText(fixtures[profile].routes.length === 1 ? `${label} walk` : `${label} · Option 1`);
    expect(screen.getAllByText(eta).length).toBeGreaterThan(0);
    expect(JSON.parse(fetcher.mock.calls.at(-1)![1].body).profile).toBe(profile);
  }
  fireEvent.press(screen.getByRole('radio', { name: 'Fastest' }));
  await screen.findByText('Fastest · Option 1');
  expect(fetcher).toHaveBeenCalledTimes(3);
});

it('sends real WGS84 coordinates when the destination changes', async () => {
  render(<PlannerScreen />); await screen.findByText('Fastest · Option 1');
  fireEvent.press(screen.getByRole('button', { name: 'To · NU Sentral · main entrance' }));
  fireEvent.press(screen.getByRole('button', { name: 'Little India · mapped approach' }));
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  expect(JSON.parse(fetcher.mock.calls[1][1].body).destination).toEqual({ latitude: 3.1289663, longitude: 101.6839915 });
});

it('shows a single valid option and complete backend warnings/explanations', async () => {
  const response = { ...fixtures.step_free, routes: fixtures.step_free.routes.slice(0, 1) };
  fetcher.mockResolvedValue({ ok: true, json: async () => ({ ...response, routes: response.routes.map(r => ({ ...r, profile: 'fastest' })) }) });
  render(<PlannerScreen />); await screen.findByText('Fastest walk');
  fireEvent.press(screen.getByRole('button', { name: 'Walking route details' }));
  expect(screen.getByRole('button', { name: 'Collapse comparison' })).toBeTruthy();
  expect(within(screen.getByLabelText('Route options')).getAllByRole('radio')).toHaveLength(1);
  for (const reason of response.routes[0].reasons) expect(screen.getByText(reason)).toBeTruthy();
  for (const warning of response.routes[0].warnings) expect(screen.getByText(warning)).toBeTruthy();
  expect(screen.getByText(/Data: High data confidence/)).toBeTruthy();
});

it('surfaces unknown accessibility directly from API warnings', async () => {
  render(<PlannerScreen />); await screen.findByText('Fastest · Option 1');
  fireEvent.press(screen.getByRole('button', { name: 'Compare 3 routes' }));
  fireEvent.press(screen.getByRole('radio', { name: 'Safer at Night' }));
  await screen.findByText('Safer at Night · Option 1');
  const card = within(screen.getByLabelText('Route options')).getAllByRole('radio')[0];
  for (const warning of fixtures.safer_at_night.routes[0].warnings) expect(within(card).getByText(warning)).toBeTruthy();
});

it('opens with one concise route and keeps Start reachable while expanding details and trip tools', async () => {
  render(<PlannerScreen />); await screen.findByText('Fastest · Option 1');
  const toggle = screen.getByRole('button', { name: 'Compare 3 routes' });
  expect(toggle.props.accessibilityState.expanded).toBe(false);
  expect(within(screen.getByLabelText('Route options')).getAllByRole('radio')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Start navigation' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Set destination on map' })).toBeNull();
  fireEvent.press(toggle);
  expect(screen.getByRole('button', { name: 'Collapse comparison' }).props.accessibilityState.expanded).toBe(true);
  expect(screen.getByRole('button', { name: 'Set destination on map' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Share selected route' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Report Barrier' })).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Collapse comparison' }));
  expect(screen.getByRole('button', { name: 'Start navigation' })).toBeTruthy();
});

it.each(['no_route', 'timeout', 'network'] as const)('renders %s with retry and preserves the trip', async kind => {
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  if (kind === 'no_route') fetcher.mockResolvedValue({ ok: false, status: 404, json: async () => ({ detail: 'No route is available for the selected profile.' }) });
  else if (kind === 'network') fetcher.mockRejectedValue(new TypeError('private network error'));
  else fetcher.mockImplementation((_url, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener('abort', () => reject(new Error('aborted')));
  }));
  if (kind === 'timeout') jest.useFakeTimers();
  render(<PlannerScreen />);
  if (kind === 'timeout') await act(async () => { await jest.advanceTimersByTimeAsync(10000); });
  await screen.findByText(kind === 'no_route' ? 'No route available' : "Couldn't load routes.");
  if (kind === 'timeout') expect(screen.getByText('The routing service took too long to respond.')).toBeTruthy();
  expect(screen.queryByText('private network error')).toBeNull();
  expect(screen.getByRole('button', { name: 'To · NU Sentral · main entrance' })).toBeTruthy();
  fetcher.mockResolvedValue({ ok: true, json: async () => fixtures.fastest });
  fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  await screen.findByText('Fastest · Option 1');
  jest.useRealTimers();
});

it('ignores an obsolete response after a rapid profile switch', async () => {
  let finish: (value: unknown) => void = () => {};
  fetcher.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<PlannerScreen />);
  fireEvent.press(screen.getByRole('radio', { name: 'Step-Free' }));
  await screen.findByText('Step-Free walk');
  await act(async () => finish({ ok: true, json: async (): Promise<RouteResponse> => fixtures.fastest as RouteResponse }));
  expect(screen.queryByText('Fastest · Option 1')).toBeNull();
  expect(screen.getByRole('image').props.accessibilityLabel).toContain('Selected Step-Free');
});

it('keeps Step-Free selected when no verified path exists', async () => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
  render(<PlannerScreen />); await screen.findByText('Fastest · Option 1');
  fetcher.mockResolvedValue({ ok: false, status: 404, json: async () => ({ detail: 'No verified step-free route is available for this trip.' }) });
  fireEvent.press(screen.getByRole('radio', { name: 'Step-Free' }));
  await screen.findByText('No verified step-free route is available for this trip.');
  expect(screen.getByRole('radio', { name: 'Step-Free', checked: true })).toBeTruthy();
  expect(screen.getByRole('image').props.accessibilityLabel).toContain('No route is displayed');
});

it('includes saved supported preferences in the typed routing request', async () => {
  const { PreferencesProvider } = require('../src/features/preferences/PreferencesProvider');
  const { preferenceRepository } = require('../src/features/preferences/repository');
  const { defaultPreferences } = require('../src/features/preferences/model');
  await preferenceRepository.save({ onboardingCompleted: true, preferences: { ...defaultPreferences, avoidStairs: true, preferWellLit: true } });
  render(<PreferencesProvider><PlannerScreen/></PreferencesProvider>);
  await screen.findByText('Fastest · Option 1');
  expect(JSON.parse(fetcher.mock.calls[0][1].body).preferences).toMatchObject({ avoid_stairs: true, prefer_well_lit: true });
});

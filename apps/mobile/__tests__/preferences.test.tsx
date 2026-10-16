import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PreferencesProvider } from '../src/features/preferences/PreferencesProvider';
import { ProfileScreen } from '../src/features/preferences/Screens';
import { createPreferenceRepository } from '../src/features/preferences/repository';
import { defaultPreferences, toRoutePreferences } from '../src/features/preferences/model';

beforeEach(async () => { await AsyncStorage.clear(); });
it('first launch offers onboarding, saves explicit needs, and skips it on relaunch', async () => {
  const view = render(<PreferencesProvider><Text>Planner content</Text></PreferencesProvider>);
  await screen.findByText('Welcome to Jom!');
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.press(screen.getByRole('checkbox', { name: 'Prefer well-lit paths' }));
  fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  fireEvent.press(screen.getByRole('checkbox', { name: 'Avoid stairs' }));
  fireEvent.press(screen.getByRole('button', { name: 'Finish onboarding' }));
  await screen.findByText('Planner content'); view.unmount();
  const stored = await createPreferenceRepository().load();
  expect(stored.preferences.preferWellLit).toBe(true); expect(stored.preferences.avoidStairs).toBe(true);
  render(<PreferencesProvider><Text>Planner content</Text></PreferencesProvider>);
  await screen.findByText('Planner content'); expect(screen.queryByText('Welcome to Jom!')).toBeNull();
});
it('Profile edits and resets saved preferences without identity fields', async () => {
  const repository = createPreferenceRepository();
  await repository.save({ onboardingCompleted: true, preferences: defaultPreferences });
  render(<PreferencesProvider><ProfileScreen/></PreferencesProvider>);
  await screen.findByText('Profile');
  fireEvent.press(screen.getByRole('checkbox', { name: 'Avoid stairs' }));
  fireEvent.press(screen.getByRole('button', { name: 'Save preferences' }));
  await waitFor(async () => expect((await repository.load()).preferences.avoidStairs).toBe(true));
  expect(Object.keys((await repository.load()).preferences)).toEqual(Object.keys(defaultPreferences));
  fireEvent.press(screen.getByRole('button', { name: 'Reset preferences' }));
  fireEvent.press(screen.getByRole('button', { name: 'Save preferences' }));
  await waitFor(async () => expect((await repository.load()).preferences.avoidStairs).toBe(false));
});
it('maps only supported routing fields and keeps unsupported needs local', () => {
  const result = toRoutePreferences({ ...defaultPreferences, preferWellLit: true, avoidStairs: true, preferCoveredPaths: true, preferRampsElevators: true, maxDetourMinutes: 5 });
  expect(result).toEqual({ prefer_well_lit: true, avoid_stairs: true, avoid_steep_slopes: false, prefer_public_areas: false, max_detour_minutes: 5 });
});
it('retains onboarding draft through back, and skip persists completion', async () => {
  render(<PreferencesProvider><Text>Planner content</Text></PreferencesProvider>);
  await screen.findByText('Welcome to Jom!'); fireEvent.press(screen.getByText('Continue'));
  fireEvent.press(screen.getByRole('checkbox', { name: 'Prefer well-lit paths' }));
  fireEvent.press(screen.getByText('Back')); fireEvent.press(screen.getByText('Continue'));
  expect(screen.getByRole('checkbox', { name: 'Prefer well-lit paths', checked: true })).toBeTruthy();
  fireEvent.press(screen.getByText('Skip remaining setup')); await screen.findByText('Planner content');
});
it('failed local save preserves draft and lets user retry', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
  render(<PreferencesProvider><Text>Planner content</Text></PreferencesProvider>);
  await screen.findByText('Welcome to Jom!'); fireEvent.press(screen.getByText('Skip setup'));
  await screen.findByRole('alert'); fireEvent.press(screen.getByText('Skip setup')); await screen.findByText('Planner content');
});

it('developer restart reopens onboarding without an account or source edits', async () => {
  const repository = createPreferenceRepository();
  await repository.save({ onboardingCompleted: true, preferences: { ...defaultPreferences, avoidStairs: true } });
  render(<PreferencesProvider><ProfileScreen/></PreferencesProvider>);
  await screen.findByText('Profile'); fireEvent.press(screen.getByText('Restart onboarding demo'));
  await screen.findByText('Welcome to Jom!'); expect((await repository.load()).onboardingCompleted).toBe(false);
});

it('initial read failure offers Retry and preserves stored preferences', async () => {
  const repository = createPreferenceRepository();
  await repository.save({ onboardingCompleted: true, preferences: { ...defaultPreferences, avoidStairs: true } });
  jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('read failed'));
  render(<PreferencesProvider><ProfileScreen/></PreferencesProvider>);
  await screen.findByText("Couldn't read preferences. Retry without losing your settings.");
  fireEvent.press(screen.getByText('Retry')); await screen.findByText('Profile');
  expect(screen.getByRole('checkbox', { name: 'Avoid stairs', checked: true })).toBeTruthy();
});

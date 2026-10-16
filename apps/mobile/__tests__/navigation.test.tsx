import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import MainLayout from '../src/app/(main)/_layout';
import CommunityScreen from '../src/app/(main)/community';
import PlannerScreen from '../src/app/(main)/index';
import ProfileScreen from '../src/app/(main)/profile';

jest.mock('../src/features/planner/PlannerScreen', () => ({
  PlannerScreen: () => {
    const { Text } = require('react-native');
    return <Text accessibilityRole="header">Planner</Text>;
  },
}));

const routes = {
  _layout: MainLayout,
  index: PlannerScreen,
  community: CommunityScreen,
  profile: ProfileScreen,
};

it('opens Planner and lets users visit Community, Profile, and return to Planner', async () => {
  const result = renderRouter(routes, { initialUrl: '/' });
  expect(screen.getByRole('header', { name: 'Planner' })).toBeTruthy();
  expect(screen.getByRole('tab', { name: 'Planner', selected: true })).toBeTruthy();

  fireEvent.press(screen.getByRole('tab', { name: 'Community' }));
  expect(result.getPathname()).toBe('/community');
  expect(await screen.findByRole('header', { name: 'Community' })).toBeTruthy();
  await screen.findByText('Local knowledge for your next walk.');

  fireEvent.press(screen.getByRole('tab', { name: 'Profile' }));
  expect(result.getPathname()).toBe('/profile');
  expect(screen.getByRole('header', { name: 'Profile' })).toBeTruthy();

  fireEvent.press(screen.getByRole('tab', { name: 'Planner' }));
  expect(result.getPathname()).toBe('/');
  expect(screen.getByRole('header', { name: 'Planner' })).toBeTruthy();
});

it.each(['/community', '/profile'])('supports opening %s directly', async (initialUrl) => {
  const result = renderRouter(routes, { initialUrl });
  expect(result.getPathname()).toBe(initialUrl);
  expect(screen.getAllByRole('tab')).toHaveLength(3);
  if (initialUrl === '/community') await screen.findByText('Local knowledge for your next walk.');
});

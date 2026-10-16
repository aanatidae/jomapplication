import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommunityScreen } from '../src/features/community/CommunityScreen';
import { DetailScreen } from '../src/features/community/DetailScreen';
import { ShareScreen } from '../src/features/community/ShareScreen';
import { createCommunityRepository } from '../src/features/community/repository';
import { seededCommunityRoutes, seedPaths } from '../src/features/community/data';
import type { CreateCommunityRouteInput } from '../src/features/community/types';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
beforeEach(async () => { await AsyncStorage.clear(); });
const valid: CreateCommunityRouteInput = { title: 'Covered mall shortcut', notes: 'Check the entrance opening hours.', purposeTags: ['Shortcut'], accessibilityTags: ['Ramp available'], routeWarnings: [], photos: [], route: seedPaths[1], lastWalkedAt: '2026-10-15' };
it('feed renders seeded routes and opens complete detail', async () => {
  const repository = createCommunityRepository(); const feed = render(<CommunityScreen repository={repository}/>);
  await screen.findByText(seededCommunityRoutes[0].title);
  expect(screen.getAllByText('Community submitted')).toHaveLength(2); feed.unmount();
  render(<DetailScreen repository={repository} id="plaza-walk"/>);
  await screen.findByText(seededCommunityRoutes[0].notes);
  expect(screen.getByRole('image').props.accessibilityLabel).toContain('not for navigation');
});
it('share validates title, route and purpose, creates locally and appears in feed after repository recreation', async () => {
  const repository = createCommunityRepository(); const view = render(<ShareScreen repository={repository}/>);
  fireEvent.press(screen.getByText('Submit route'));
  expect(screen.getByText('Choose a route to share.')).toBeTruthy();
  expect(screen.getByText('Choose at least one purpose.')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Route title'), valid.title);
  fireEvent.press(screen.getByRole('radio', { name: 'Safer at Night demo route · 10 min' }));
  fireEvent.press(screen.getByRole('checkbox', { name: 'Shortcut' }));
  fireEvent.changeText(screen.getByLabelText('Route notes'), valid.notes);
  fireEvent.press(screen.getByRole('checkbox', { name: 'Ramp available' }));
  fireEvent.press(screen.getByText('Submit route')); await screen.findByText('Route shared');
  expect(screen.getByText('Community submitted')).toBeTruthy(); view.unmount();
  const reloaded = createCommunityRepository(); const rows = await reloaded.listRoutes();
  expect(rows[0]).toMatchObject({ title: valid.title, verificationLevel: 'community_submitted', accessibilityTags: ['Ramp available'] });
  render(<CommunityScreen repository={reloaded}/>); await screen.findByText(valid.title);
});
it('rejects contradictory tags and never accepts caller verification or identity overrides', async () => {
  const repository = createCommunityRepository();
  await expect(repository.createRoute({ ...valid, accessibilityTags: ['Step-free', 'Stairs present'] })).rejects.toThrow();
  const created = await repository.createRoute({ ...valid, verificationLevel: 'verified', author: 'Official' } as CreateCommunityRouteInput);
  expect(created.verificationLevel).toBe('community_submitted'); expect(created.author).toBe('You · local contributor');
});
it('empty feed teaches how to share', async () => {
  render(<CommunityScreen repository={createCommunityRepository(undefined, [])}/>);
  await screen.findByText('No routes shared yet. Share a useful walk to start the feed.');
});
it('failed save retains the route draft and retries', async () => {
  const repository = createCommunityRepository();
  const create = jest.spyOn(repository, 'createRoute').mockRejectedValueOnce(new Error('disk full'));
  render(<ShareScreen repository={repository}/>);
  fireEvent.changeText(screen.getByLabelText('Route title'), 'A useful walk');
  fireEvent.press(screen.getByRole('radio', { name: 'Fastest demo route · 8 min' }));
  fireEvent.press(screen.getByRole('checkbox', { name: 'Walking' }));
  fireEvent.press(screen.getByText('Submit route'));
  await screen.findByText('Could not save the route. Your draft is still here. Try submitting again.');
  expect(screen.getByLabelText('Route title').props.value).toBe('A useful walk');
  fireEvent.press(screen.getByText('Submit route')); await screen.findByText('Route shared'); expect(create).toHaveBeenCalledTimes(2);
});

it('content flag is a real local action with explicit no-moderation disclosure', async () => {
  const { createContentReportRepository } = require('../src/features/community/contentReports');
  const contentRepository = createContentReportRepository();
  const create = jest.spyOn(contentRepository, 'create');
  render(<DetailScreen repository={createCommunityRepository()} contentRepository={contentRepository} id="plaza-walk"/>);
  await screen.findByText(seededCommunityRoutes[0].notes);
  fireEvent.press(screen.getByText('Report content')); fireEvent.press(screen.getByRole('radio', { name: 'Inappropriate content' }));
  fireEvent.press(screen.getByText('Save local content flag'));
  await screen.findByText('Content flag saved on this device. No moderation service is connected.');
  expect(create).toHaveBeenCalledWith('plaza-walk', 'Inappropriate content');
});

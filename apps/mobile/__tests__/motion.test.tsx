import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MotionProvider, MotionPressable, useMotionReduced } from '../src/features/motion/Motion';
import { ShareScreen } from '../src/features/community/ShareScreen';
import { createCommunityRepository } from '../src/features/community/repository';
import { seedPaths } from '../src/features/community/data';

function Probe() { const reduced = useMotionReduced(); return <Text>{reduced ? 'Movement off' : 'Movement on'}</Text>; }
afterEach(() => jest.restoreAllMocks());
it('defaults safely, follows live Reduce Motion changes and removes its subscription', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  let change: (value: boolean) => void = () => {}; const remove = jest.fn();
  (jest.spyOn(AccessibilityInfo, 'addEventListener') as unknown as jest.SpyInstance<{ remove: () => void }, [string, (value: boolean) => void]>).mockImplementation((event, handler) => {
    if (event === 'reduceMotionChanged') change = handler as (value: boolean) => void;
    return { remove };
  });
  const press = jest.fn();
  const view = render(<MotionProvider><Probe/><MotionPressable accessibilityRole="button" accessibilityLabel="Commit" onPress={press}><Text>Commit</Text></MotionPressable></MotionProvider>);
  await screen.findByText('Movement on');
  act(() => change(true)); expect(screen.getByText('Movement off')).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Commit' })); expect(press).toHaveBeenCalledTimes(1);
  view.unmount(); expect(remove).toHaveBeenCalled();
});
it('does not let a late initial preference overwrite a newer OS event', async () => {
  let resolve: (value: boolean) => void = () => {}; let change: (value: boolean) => void = () => {};
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise(done => { resolve = done; }));
  (jest.spyOn(AccessibilityInfo, 'addEventListener') as unknown as jest.SpyInstance<{ remove: () => void }, [string, (value: boolean) => void]>).mockImplementation((_event, handler) => { change = handler as (value: boolean) => void; return { remove: jest.fn() }; });
  render(<MotionProvider><Probe/></MotionProvider>);
  act(() => change(true)); await act(async () => resolve(false));
  expect(screen.getByText('Movement off')).toBeTruthy();
});
it('prevents duplicate publication and gives success feedback only after storage confirms it', async () => {
  jest.clearAllMocks();
  const repository = createCommunityRepository();
  let finish: () => void = () => {};
  const original = repository.createRoute;
  const create = jest.spyOn(repository, 'createRoute').mockImplementation(input => new Promise(resolve => { finish = () => { void original(input).then(resolve); }; }));
  render(<ShareScreen repository={repository} initialDraft={{ title: 'A useful walk', notes: '', purposeTags: ['Walking'], accessibilityTags: [], routeWarnings: [], photos: [], route: seedPaths[0] }}/>);
  const submit = screen.getByRole('button', { name: 'Submit route' });
  act(() => { fireEvent.press(submit); fireEvent.press(submit); });
  expect(create).toHaveBeenCalledTimes(1);
  expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  expect(screen.queryByText('Route shared')).toBeNull();
  await act(async () => finish()); await screen.findByText('Route shared');
  await waitFor(() => expect(Haptics.notificationAsync).toHaveBeenCalledTimes(1));
});

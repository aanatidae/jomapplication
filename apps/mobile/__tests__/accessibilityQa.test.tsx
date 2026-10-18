import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { CommunityScreen } from '../src/features/community/CommunityScreen';
import { DetailScreen } from '../src/features/community/DetailScreen';
import { ReportsScreen } from '../src/features/barriers/ReportsScreen';
import { Field } from '../src/components/Forms';
import { ExpandableText } from '../src/components/ExpandableText';
import { LocalPhoto } from '../src/components/LocalPhoto';
import { launchImageLibraryAsync } from 'expo-image-picker';
import { ReportScreen } from '../src/features/barriers/ReportScreen';
import { createBarrierRepository } from '../src/features/barriers/repository';
import { routeLocations } from '../src/features/barriers/model';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
it.each(['feed', 'detail', 'reports'] as const)('shows loading and prevents repeated read retries for %s', async flow => {
  let complete: (value: never[] | null) => void = () => {};
  const read = jest.fn().mockRejectedValueOnce(new Error('offline')).mockImplementation(() => new Promise(resolve => { complete = resolve; }));
  if (flow === 'reports') render(<ReportsScreen repository={{ listReports: read, createReport: jest.fn() }}/>);
  else if (flow === 'detail') render(<DetailScreen id="missing" repository={{ listRoutes: jest.fn(), getRoute: read, createRoute: jest.fn() }}/>);
  else render(<CommunityScreen repository={{ listRoutes: read, getRoute: jest.fn(), createRoute: jest.fn() }}/>);
  await screen.findByRole('alert');
  fireEvent.press(screen.getByRole('button', { name: 'Retry' }));
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  expect(screen.getByText(/^Loading/)).toBeTruthy();
  expect(read).toHaveBeenCalledTimes(2);
  await act(async () => complete(flow === 'detail' ? null : []));
});
it('describes validation errors at the input and announces expandable content state', () => {
  render(<><Field label="Route title" value="" maxLength={100} onChangeText={jest.fn()} error="Enter a route title."/><ExpandableText text={'Entrance details and crossing conditions. '.repeat(25)}/></>);
  expect(screen.getByLabelText('Route title').props.accessibilityHint).toBe('Enter a route title.');
  expect(screen.getByRole('alert')).toBeTruthy();
  const expand = screen.getByRole('button', { name: 'Read full description' });
  expect(expand.props.accessibilityState.expanded).toBe(false); fireEvent.press(expand);
  expect(screen.getByRole('button', { name: 'Show less' }).props.accessibilityState.expanded).toBe(true);
});
it('opens only one picker and preserves the attached photo when selection is cancelled', async () => {
  let finish: (value: Awaited<ReturnType<typeof launchImageLibraryAsync>>) => void = () => {};
  jest.mocked(launchImageLibraryAsync).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  const onChange = jest.fn(); render(<LocalPhoto uri="file:///existing.jpg" onChange={onChange}/>);
  const choose = screen.getByRole('button', { name: 'Change photo' });
  act(() => { fireEvent.press(choose); fireEvent.press(choose); });
  expect(launchImageLibraryAsync).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Remove photo' }).props.accessibilityState.disabled).toBe(true);
  await act(async () => finish({ canceled: true, assets: null }));
  expect(onChange).not.toHaveBeenCalled(); expect(screen.getByLabelText('Attached local photo')).toBeTruthy();
});
it('keeps barrier review intact through a slow failed submission and blocks duplicate writes', async () => {
  const repository = createBarrierRepository();
  let fail: (error: Error) => void = () => {};
  const create = jest.spyOn(repository, 'createReport').mockImplementation(() => new Promise((_resolve, reject) => { fail = reject; }));
  render(<ReportScreen routeOverride={null} repository={repository} initialDraft={{ category: 'flooded_path', location: routeLocations(null)[0], description: 'Flood water covers the crossing.', conditionType: 'temporary' }}/>);
  for (let step = 0; step < 3; step++) fireEvent.press(screen.getByRole('button', { name: 'Continue' }));
  const submit = screen.getByRole('button', { name: 'Submit report' });
  act(() => { fireEvent.press(submit); fireEvent.press(submit); });
  expect(create).toHaveBeenCalledTimes(1); expect(screen.queryByText('Report submitted')).toBeNull();
  await act(async () => fail(new Error('offline')));
  expect(screen.getByRole('alert')).toBeTruthy(); expect(screen.getByText('Flood water covers the crossing.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Submit report' }).props.accessibilityState.disabled).toBe(false);
});

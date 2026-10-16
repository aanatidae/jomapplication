import { fireEvent, render, screen } from '@testing-library/react-native';
import { CommunityScreen } from '../src/features/community/CommunityScreen';
import { DetailScreen } from '../src/features/community/DetailScreen';
import { createCommunityRepository, validateShare } from '../src/features/community/repository';
import { createBarrierRepository } from '../src/features/barriers/repository';
import { ReportScreen } from '../src/features/barriers/ReportScreen';
import { worstCommunity, worstNotes, worstTitle } from '../src/features/qa/StressScreen';
import { seedPaths } from '../src/features/community/data';
import type { KeyValueStorage } from '../src/services/localStorage';
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
function memory(): KeyValueStorage { const map = new Map<string, string>(); return { getItem: async k => map.get(k) ?? null, setItem: async (k, v) => { map.set(k, v); } }; }
it('renders max title, many tags, absent photos, freshness and long author without truncating the title', async () => {
  render(<CommunityScreen repository={createCommunityRepository(memory(), worstCommunity)}/>);
  await screen.findByText(worstTitle); expect(screen.getAllByText('View route')).toHaveLength(2);
  expect(screen.getByText(worstTitle).props.numberOfLines).toBeUndefined();
});
it('detail exposes full long notes and invalid photo fallback', async () => {
  const repository = createCommunityRepository(memory(), [{ ...worstCommunity[0], photos: ['file:///missing.jpg'] }]);
  render(<DetailScreen id="plaza-walk" repository={repository}/>);
  await screen.findByText('Read full description'); fireEvent.press(screen.getByText('Read full description'));
  expect(screen.getByText(worstNotes)).toBeTruthy(); fireEvent(screen.getByLabelText('Attached local photo'), 'error');
  expect(screen.getByText('Photo unavailable on this device.')).toBeTruthy();
});
it('limits initial feed rendering and reveals more entries on request', async () => {
  const seed = Array.from({ length: 1000 }, (_, i) => ({ ...worstCommunity[0], id: String(i), title: `Local walk ${i + 1}` }));
  render(<CommunityScreen repository={createCommunityRepository(memory(), seed)}/>);
  await screen.findByText('Local walk 1'); expect(screen.getAllByText('View route')).toHaveLength(20);
  fireEvent.press(screen.getByText('Show more')); expect(screen.getAllByText('View route')).toHaveLength(40);
});
it('validates long text, real dates and accessibility contradictions at the data boundary', () => {
  const valid = { title: worstTitle, notes: worstNotes, route: seedPaths[0], purposeTags: ['Walking'], accessibilityTags: [], routeWarnings: [], photos: [] };
  expect(validateShare(valid)).toEqual({});
  expect(validateShare({ ...valid, title: ' '.repeat(100) }).title).toBeTruthy();
  expect(validateShare({ ...valid, notes: 'x'.repeat(2001) }).notes).toBeTruthy();
  expect(validateShare({ ...valid, lastWalkedAt: '2026-02-30' }).date).toBeTruthy();
});
it('barrier without a map or photo can use the explicit demo location and maximum details', async () => {
  const repository = createBarrierRepository(memory());
  render(<ReportScreen routeOverride={null} repository={repository} initialDraft={{ category: 'construction', location: null, description: worstNotes, conditionType: 'temporary' }}/>);
  fireEvent.press(screen.getByText('Continue'));
  expect(screen.getByText('No active route or live location is available. You can associate this report with the labelled demo location.')).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: 'Transit Stop · deterministic demo location' }));
  fireEvent.press(screen.getByText('Continue')); fireEvent.press(screen.getByText('Continue')); fireEvent.press(screen.getByText('Submit report'));
  await screen.findByText('Report submitted'); expect((await repository.listReports())[0].description).toBe(worstNotes);
});
it('concurrent local submissions do not overwrite each other', async () => {
  const repository = createCommunityRepository(memory(), []);
  const input = { title: 'A route', notes: '', route: seedPaths[0], purposeTags: ['Walking'], accessibilityTags: [], routeWarnings: [], photos: [] };
  await Promise.all([repository.createRoute(input), repository.createRoute({ ...input, title: 'Another route' })]);
  expect(await repository.listRoutes()).toHaveLength(2);
});

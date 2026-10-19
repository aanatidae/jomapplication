import { fireEvent, render, screen } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReportScreen } from '../src/features/barriers/ReportScreen';
import { ReportsScreen } from '../src/features/barriers/ReportsScreen';
import { barrierCategories, routeLocations, setReportRoute, type CreateBarrierReportInput } from '../src/features/barriers/model';
import { createBarrierRepository } from '../src/features/barriers/repository';
import { seedPaths } from '../src/features/community/data';
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
beforeEach(async () => { await AsyncStorage.clear(); setReportRoute(null); });
const valid: CreateBarrierReportInput = { category: 'blocked_walkway', location: routeLocations(null)[0], description: 'A fallen branch blocks the walkway.', conditionType: 'temporary' };
it('all required categories render and category/location/details validation prevents unusable submissions', () => {
  render(<ReportScreen repository={createBarrierRepository()}/>);
  for (const category of Object.values(barrierCategories)) expect(screen.getByRole('radio', { name: category })).toBeTruthy();
  fireEvent.press(screen.getByText('Continue')); expect(screen.getByText('Choose an issue category.')).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: 'Broken or blocked walkway' })); fireEvent.press(screen.getByText('Continue'));
  fireEvent.press(screen.getByText('Continue')); expect(screen.getByText('Choose a labelled route point or map location.')).toBeTruthy();
  fireEvent.press(screen.getByRole('radio', { name: 'KL Sentral · south entrance' })); fireEvent.press(screen.getByText('Continue'));
  fireEvent.press(screen.getByText('Continue')); expect(screen.getByText('Describe the issue in 1–2,000 characters.')).toBeTruthy();
});
it('temporary submission records timestamp, persists on reload, and is inspectable as community submitted', async () => {
  const repository = createBarrierRepository(undefined, () => new Date('2026-10-16T12:00:00Z'));
  setReportRoute(seedPaths[1]); const view = render(<ReportScreen repository={repository}/>);
  fireEvent.press(screen.getByRole('radio', { name: 'Broken or blocked walkway' })); fireEvent.press(screen.getByText('Continue'));
  fireEvent.press(screen.getByRole('radio', { name: 'Route point 2' })); fireEvent.press(screen.getByText('Continue'));
  fireEvent.changeText(screen.getByLabelText('Issue description'), valid.description);
  fireEvent.press(screen.getByRole('radio', { name: 'Temporary' })); fireEvent.press(screen.getByText('Continue'));
  expect(screen.getByText('Condition: temporary')).toBeTruthy(); fireEvent.press(screen.getByText('Submit report'));
  await screen.findByText('Report submitted'); expect(screen.getByText('Community submitted')).toBeTruthy(); view.unmount();
  const rows = await createBarrierRepository().listReports();
  expect(rows[0]).toMatchObject({ verificationLevel: 'community_submitted', reportedAt: '2026-10-16T12:00:00.000Z', expiresAt: '2026-10-17T12:00:00.000Z', conditionType: 'temporary', location: { routeId: seedPaths[1].id, waypointIndex: 1 } });
  render(<ReportsScreen repository={createBarrierRepository()}/>); await screen.findByText(valid.description);
});
it.each(['temporary', 'permanent', 'unknown'] as const)('preserves %s condition and never accepts auto verification', async conditionType => {
  const report = await createBarrierRepository().createReport({ ...valid, conditionType, verificationLevel: 'verified' } as CreateBarrierReportInput);
  expect(report.conditionType).toBe(conditionType); expect(report.verificationLevel).toBe('community_submitted');
  expect(Boolean(report.expiresAt)).toBe(conditionType === 'temporary');
});
it('failed local save retains details and retries', async () => {
  const repository = createBarrierRepository(); jest.spyOn(repository, 'createReport').mockRejectedValueOnce(new Error('disk full'));
  setReportRoute(seedPaths[0]); render(<ReportScreen repository={repository}/>);
  fireEvent.press(screen.getByRole('radio', { name: 'Flooded path' })); fireEvent.press(screen.getByText('Continue')); fireEvent.press(screen.getByText('Continue'));
  fireEvent.changeText(screen.getByLabelText('Issue description'), 'Water covers the walkway.'); fireEvent.press(screen.getByText('Continue')); fireEvent.press(screen.getByText('Submit report'));
  await screen.findByText('Could not save your report. Your details are still here. Retry submission.');
  expect(screen.getByText('Water covers the walkway.')).toBeTruthy();
  fireEvent.press(screen.getByText('Submit report')); await screen.findByText('Report submitted');
});
it('rejects invalid location and blank description at repository boundary', async () => {
  const repository = createBarrierRepository();
  await expect(repository.createReport({ ...valid, location: null })).rejects.toThrow();
  await expect(repository.createReport({ ...valid, description: '  ' })).rejects.toThrow();
  await expect(repository.createReport({ ...valid, location: { ...valid.location!, point: [NaN, 0] } })).rejects.toThrow();
  expect(await repository.listReports()).toEqual([]);
});

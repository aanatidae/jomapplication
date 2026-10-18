import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { confidenceLabel, isStale, relativeDate, reportStatus, verificationLabel } from '../src/features/quality/policy';
import { ReportSummary } from '../src/features/barriers/ReportSummary';
import { DataSourceInfo } from '../src/features/quality/DataSourceInfo';
import { toDisplayRoutes } from '../src/features/planner/routePresentation';
import fixtures from './fixtures/routes.json';
import type { RouteOption } from '../src/services/routingApi';

const now = new Date('2026-10-18T12:00:00+08:00').getTime();
it('maps server categories and preserves unknown confidence', () => {
  expect(['High', 'Medium', 'Low', undefined, 'safe'].map(confidenceLabel)).toEqual(['High data confidence', 'Medium data confidence', 'Low data confidence', 'Data confidence unknown', 'Data confidence unknown']);
});
it('requires actual evidence for confirmations and handles unknown verification', () => {
  expect(verificationLabel('community_submitted')).toBe('Community submitted');
  expect(verificationLabel('confirmed')).toBe('Confirmation evidence unavailable');
  expect(verificationLabel('confirmed', 1)).toBe('Confirmation evidence unavailable');
  expect(verificationLabel('confirmed', 2)).toBe('Confirmed by multiple users');
  expect(verificationLabel('verified')).toBe('Township/venue verified');
  expect(verificationLabel('unexpected')).toBe('Verification unknown');
});
it('uses local calendar boundaries and never treats unknown or future dates as fresh verification', () => {
  expect(relativeDate(undefined, now)).toBe('date unknown');
  expect(relativeDate('invalid', now)).toBe('date unknown');
  expect(relativeDate('2026-02-30', now)).toBe('date unknown');
  expect(relativeDate('2026-10-19T00:00:00+08:00', now)).toBe('date unknown');
  expect(relativeDate('2026-10-18T01:00:00+08:00', now)).toBe('today');
  expect(isStale('2026-10-01T00:00:00Z', 7, now)).toBe(true);
  expect(isStale('2026-10-01T00:00:00Z', 30, now)).toBe(false);
});
it('distinguishes expired, active, permanent and unknown reports including exact expiry', () => {
  const report = { conditionType: 'temporary', reportedAt: '2026-10-18T00:00:00Z', expiresAt: new Date(now).toISOString() };
  expect(reportStatus(report, now)).toMatch(/^Expired/);
  expect(reportStatus(report, now - 1)).toMatch(/^Active report/);
  expect(reportStatus({ ...report, expiresAt: undefined }, now)).toMatch(/^Expiry unknown/);
  expect(reportStatus({ ...report, conditionType: 'permanent', expiresAt: undefined }, now)).toMatch(/^Ongoing report/);
  expect(reportStatus({ ...report, conditionType: 'unknown', expiresAt: undefined }, now)).toMatch(/^Duration unknown/);
});
it('updates a mounted temporary report after expiration without changing verification', () => {
  jest.useFakeTimers(); jest.setSystemTime(now);
  render(<ReportSummary report={{ id: 'expiry', category: 'flooded_path', location: { label: 'Demo', point: [0, 0], coordinateSystem: 'schematic_demo' }, description: 'Water', reportedAt: new Date(now - 1000).toISOString(), expiresAt: new Date(now + 1000).toISOString(), conditionType: 'temporary', verificationLevel: 'community_submitted' }}/>);
  expect(screen.getByText(/^Active report/)).toBeTruthy();
  act(() => jest.advanceTimersByTime(30000));
  expect(screen.getByText(/^Expired/)).toBeTruthy();
  expect(screen.getByText('Community submitted')).toBeTruthy();
  jest.useRealTimers();
});
it('ages changing conditions sooner than stable infrastructure without changing verification', () => {
  const report = { conditionType: 'permanent', reportedAt: new Date(now - 8 * 86400000).toISOString() };
  expect(reportStatus({ ...report, category: 'poor_lighting' }, now)).toMatch(/^Outdated/);
  expect(reportStatus({ ...report, category: 'missing_ramp' }, now)).toMatch(/^Ongoing/);
  expect(reportStatus({ ...report, category: 'flooded_path' }, now)).toMatch(/^Outdated/);
});
it('keeps missing route metadata unknown and exposes source details without a safety probability', () => {
  const route = toDisplayRoutes(fixtures.fastest.routes as RouteOption[])[0];
  render(<DataSourceInfo route={route}/>);
  fireEvent.press(screen.getByRole('button', { name: 'Route data details' }));
  expect(screen.getByText('Verification date unknown')).toBeTruthy();
  expect(screen.getByText('Accessibility verification unavailable')).toBeTruthy();
  expect(screen.getByText(/not the probability of personal safety/)).toBeTruthy();
  fireEvent.press(screen.getByRole('button', { name: 'Close data details' }));
});

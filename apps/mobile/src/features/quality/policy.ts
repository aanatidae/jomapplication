// Presentation policy only. Routing confidence and traversal decisions remain server-owned.
export const freshnessDays = { lighting: 7, infrastructure: 30, entrance: 30, photo: 90, communityWalk: 30 } as const;
export const TEMPORARY_REPORT_HOURS = 24;
export const reportFreshnessDays = {
  lift_unavailable: 1, flooded_path: 1, construction: 1,
  poor_lighting: freshnessDays.lighting, blocked_walkway: freshnessDays.infrastructure,
  missing_ramp: freshnessDays.infrastructure, unsafe_crossing: freshnessDays.infrastructure,
  incorrect_map: freshnessDays.infrastructure,
} as const;
export function confidenceLabel(level: unknown): string {
  return level === 'High' || level === 'Medium' || level === 'Low' ? `${level} data confidence` : 'Data confidence unknown';
}
export function timestamp(value?: string): number | undefined {
  if (!value) return undefined;
  // Date-only user input is a local calendar date, not UTC midnight.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const time = dateOnly ? new Date(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]).getTime() : Date.parse(value);
  if (dateOnly) {
    const parsed = new Date(time);
    if (parsed.getFullYear() !== +dateOnly[1] || parsed.getMonth() !== +dateOnly[2] - 1 || parsed.getDate() !== +dateOnly[3]) return undefined;
  }
  return Number.isFinite(time) ? time : undefined;
}
export function relativeDate(value: string | undefined, now = Date.now()): string {
  const time = timestamp(value);
  if (time === undefined || time > now) return 'date unknown';
  const today = new Date(now); const then = new Date(time);
  const days = Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(then.getFullYear(), then.getMonth(), then.getDate())) / 86400000);
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : days < 14 ? `${days} days ago` : days < 60 ? `${Math.floor(days / 7)} weeks ago` : `${Math.floor(days / 30)} months ago`;
}
export function isStale(value: string | undefined, days: number, now = Date.now()): boolean {
  const time = timestamp(value);
  return time !== undefined && time <= now && now - time > days * 86400000;
}
export function verificationLabel(level: unknown, confirmationCount?: number): string {
  if (level === 'community_submitted') return 'Community submitted';
  if (level === 'confirmed') return confirmationCount !== undefined && confirmationCount >= 2 ? 'Confirmed by multiple users' : 'Confirmation evidence unavailable';
  // This state is restricted to the trusted verification process by existing DB guards.
  if (level === 'verified') return 'Township/venue verified';
  return 'Verification unknown';
}
export function reportStatus(report: { conditionType: string; expiresAt?: string; reportedAt: string; category?: keyof typeof reportFreshnessDays }, now = Date.now()) {
  const expiry = timestamp(report.expiresAt); const reported = timestamp(report.reportedAt);
  if (expiry !== undefined && expiry <= now) return 'Expired · historical report, not a current condition';
  if (reported === undefined || reported > now) return 'Report status unknown';
  if (isStale(report.reportedAt, report.category ? reportFreshnessDays[report.category] : freshnessDays.infrastructure, now)) return 'Outdated report · needs reconfirmation';
  if (report.conditionType === 'temporary') return expiry !== undefined ? 'Active report · condition not independently checked' : 'Expiry unknown · needs reconfirmation';
  if (report.conditionType === 'unknown') return 'Duration unknown · needs reconfirmation';
  return 'Ongoing report · current condition unconfirmed';
}

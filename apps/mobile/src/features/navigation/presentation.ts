import { distance, point, type Coordinate } from './geometry';
import { navigationPolicy, type NavigationState } from './session';

// Display eligibility only: this never changes GPS readings or session progress.
export function reliableNavigationDisplay(state: NavigationState, now: number): boolean {
  const fix = state.position;
  return state.status === 'active' && !state.warning && !state.error && !state.rerouting && !state.routeInvalidated && !!fix &&
    Number.isFinite(fix.timestamp) && now - fix.timestamp <= navigationPolicy.maxFixAgeMs && fix.timestamp <= now + 2000 &&
    fix.accuracy !== null && Number.isFinite(fix.accuracy) && fix.accuracy >= 0 && fix.accuracy <= navigationPolicy.maxAccuracyM;
}

/** Decorative route tangents, not device headings or turn instructions. */
export function routeChevrons(path: readonly Coordinate[]): { latitude: number; longitude: number; bearing: number }[] {
  const markers: ReturnType<typeof routeChevrons> = [];
  let walked = 0, next = 25;
  for (let i = 1; i < path.length && markers.length < 80; i++) {
    const a = point(path[i - 1]), b = point(path[i]);
    const length = distance(a, b);
    if (!Number.isFinite(length) || length === 0) continue;
    while (next < walked + length && markers.length < 80) {
      const along = next - walked;
      // Leave bends and endpoints clear, rather than implying a turn at a vertex.
      if (along >= 4 && length - along >= 4) {
        const t = along / length;
        const dx = (b.longitude - a.longitude) * Math.cos((a.latitude + b.latitude) / 2 * Math.PI / 180);
        markers.push({ latitude: a.latitude + t * (b.latitude - a.latitude), longitude: a.longitude + t * (b.longitude - a.longitude),
          bearing: (Math.atan2(dx, b.latitude - a.latitude) * 180 / Math.PI + 360) % 360 });
      }
      next += 30;
    }
    walked += length;
  }
  return markers;
}

import { routeChevrons, reliableNavigationDisplay } from '../src/features/navigation/presentation';
import { distance, point, project } from '../src/features/navigation/geometry';
import type { NavigationState } from '../src/features/navigation/session';

it('places forward chevrons on real segments, reverses with the route and skips degenerate geometry', () => {
  const path = [[101.68, 3.13], [101.681, 3.13], [101.681, 3.131]] as const;
  const markers = routeChevrons(path);
  expect(markers.length).toBeGreaterThan(3);
  for (const marker of markers) {
    expect(project(marker, path).deviation).toBeLessThan(0.01);
    expect(marker.bearing).toBeCloseTo(marker.latitude === 3.13 ? 90 : 0);
    expect(distance(marker, point(path[0]))).toBeGreaterThan(4);
  }
  expect(routeChevrons([...path].reverse())[0].bearing).toBeCloseTo(180);
  expect(routeChevrons([[0, 0], [0, 0]])).toEqual([]);
  expect(routeChevrons([])).toEqual([]);
  expect(routeChevrons([[101, 3], [102, 3]])).toHaveLength(80);
});

it('only enables directional/arrival presentation for fresh, accurate, unambiguous active navigation', () => {
  const now = 100000;
  const state: NavigationState = { status: 'active', following: true, rerouting: false,
    position: { latitude: 3.13, longitude: 101.68, accuracy: 5, timestamp: now } };
  expect(reliableNavigationDisplay(state, now)).toBe(true);
  for (const patch of [{ warning: 'Ambiguous position' }, { error: 'No route' }, { rerouting: true },
    { routeInvalidated: true }, { status: 'paused' as const }, { status: 'arrived' as const },
    { position: { ...state.position!, timestamp: now - 16000 } },
    { position: { ...state.position!, timestamp: now + 3000 } },
    { position: { ...state.position!, accuracy: 60 } }]) {
    expect(reliableNavigationDisplay({ ...state, ...patch }, now)).toBe(false);
  }
});

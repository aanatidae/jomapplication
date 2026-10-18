import type { RouteOption } from '../../services/routingApi';
export type RouteProfile = string;
export type Point = readonly [number, number];
export type MockRoute = {
  id: RouteProfile; mode: string; minutes: number; distance: number;
  reasons: string[]; confidence: string; freshness: string;
  warnings?: string[]; detour?: string; quality: 'verified' | 'community' | 'unknown' | 'data'; geometry: readonly Point[];
  dataQuality?: RouteOption['data_quality']; qualityFactors?: string[];
};
export const places = ['Transit Stop', 'Community Mall', 'Residential Block', 'Park Entrance'] as const;
export const routes: readonly MockRoute[] = [
  { id: 'fastest', detour: 'Fastest option', mode: 'Fastest', minutes: 8, distance: 600, reasons: ['Shortest travel time', '1 staircase'], confidence: 'High confidence', freshness: 'Demo verification: 3 days ago', quality: 'verified', geometry: [[0.16, 0.75], [0.40, 0.75], [0.40, 0.30], [0.82, 0.30]] },
  { id: 'night', detour: '+2 min vs fastest', mode: 'Safer at Night', minutes: 10, distance: 720, reasons: ['Better lighting', 'Passes active public areas', 'Near staffed security'], confidence: 'Community submitted', freshness: 'Demo report: 1 day ago · Unverified', quality: 'community', geometry: [[0.16, 0.75], [0.16, 0.15], [0.65, 0.15], [0.65, 0.30], [0.82, 0.30]] },
  { id: 'stepFree', detour: '+4 min vs fastest', mode: 'Step-Free', minutes: 12, distance: 830, reasons: ['No stairs', 'Uses ramp', 'Accessible entrance'], confidence: 'High confidence', freshness: 'Demo verification: 3 days ago', quality: 'verified', geometry: [[0.16, 0.75], [0.65, 0.75], [0.65, 0.52], [0.82, 0.52], [0.82, 0.30]] },
];
export const longPlace = 'Community Mall — North entrance beside the pedestrian bridge, accessible drop-off and transit interchange';
export type DemoState = 'ready' | 'loading' | 'empty' | 'mapUnavailable' | 'permissionDenied' | 'dataUnavailable' | 'unknown' | 'error';
export const demoStates: readonly { id: DemoState; label: string }[] = [
  { id: 'ready', label: 'Routes ready' }, { id: 'loading', label: 'Loading routes' },
  { id: 'empty', label: 'No route results' }, { id: 'mapUnavailable', label: 'Map unavailable' },
  { id: 'permissionDenied', label: 'Permission denied' }, { id: 'dataUnavailable', label: 'Route data unavailable' },
  { id: 'unknown', label: 'Unknown accessibility' }, { id: 'error', label: 'Generic error' },
];

// Presentation fixtures only; no route scoring or inference from the chosen places.
export function getDemoRoutes(state: DemoState, worstCase: boolean): MockRoute[] {
  return routes.map(route => {
    if (state === 'unknown') return {
      ...route, confidence: 'Accessibility unknown', quality: 'unknown',
      freshness: 'Demo: entrance and ramp status have not been checked',
      reasons: route.id === 'stepFree' ? ['Step-free candidate', 'Ramp status unknown', 'Entrance accessibility unknown'] : route.reasons,
    };
    if (worstCase) return {
      ...route,
      reasons: [...route.reasons, 'Covered pedestrian connection', 'Crossing condition has not been independently checked', 'Community-reported path condition', 'Entrance opening hours unknown'],
      confidence: 'Community submitted — pending independent confirmation of all pedestrian crossing and entrance conditions', quality: 'community',
      freshness: 'Demo submission · Awaiting verification',
    };
    return route;
  });
}

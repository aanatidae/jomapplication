import type { RoutePreferences } from '../../services/routingApi';
export type UserRoutePreferences = {
  preferWellLit: boolean; avoidStairs: boolean; avoidSteepSlopes: boolean;
  preferRampsElevators: boolean; preferPublicAreas: boolean; preferCoveredPaths: boolean;
  maxDetourMinutes?: number;
};
export const defaultPreferences: UserRoutePreferences = {
  preferWellLit: false, avoidStairs: false, avoidSteepSlopes: false,
  preferRampsElevators: false, preferPublicAreas: false, preferCoveredPaths: false,
};
export const preferenceOptions = [
  ['preferWellLit', 'Prefer well-lit paths', 'walking'],
  ['preferPublicAreas', 'Prefer active/public areas', 'walking'],
  ['preferCoveredPaths', 'Prefer covered/shaded paths · saved only', 'walking'],
  ['avoidStairs', 'Avoid stairs', 'mobility'],
  ['avoidSteepSlopes', 'Avoid steep slopes', 'mobility'],
  ['preferRampsElevators', 'Prefer ramps/elevators · saved only', 'mobility'],
] as const;
export function toRoutePreferences(p: UserRoutePreferences): RoutePreferences {
  return { prefer_well_lit: p.preferWellLit, avoid_stairs: p.avoidStairs,
    avoid_steep_slopes: p.avoidSteepSlopes, prefer_public_areas: p.preferPublicAreas,
    ...(p.maxDetourMinutes === undefined ? {} : { max_detour_minutes: p.maxDetourMinutes }) };
}

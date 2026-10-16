import type { RouteOption } from '../../services/routingApi';
import type { MockRoute } from './mockRoutes';
import { profileLabels } from './usePlanner';

// Fixed synthetic pilot bounds, in metres. This only projects geometry onto a canvas.
export function toDisplayRoutes(routes: RouteOption[]): MockRoute[] {
  return routes.map((route, index) => ({
    id: route.id, mode: `${profileLabels[route.profile]} · Option ${index + 1}`,
    minutes: Math.ceil(route.estimated_time_s / 60), distance: Math.round(route.distance_m),
    detour: '', reasons: route.reasons, warnings: route.warnings,
    confidence: `${route.confidence.level} data confidence`, quality: 'data',
    freshness: `${route.verification_summary} · Demo data as of ${new Date(route.confidence.as_of).toLocaleString()}`,
    geometry: route.geometry.coordinates.map(([x, y]) => [0.12 + x / 400 * 0.76, 0.78 - (y + 150) / 450 * 0.62] as const),
  }));
}

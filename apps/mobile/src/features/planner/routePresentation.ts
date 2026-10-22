import type { RouteOption } from '../../services/routingApi';
import type { MockRoute } from './mockRoutes';
import { profileLabels } from './usePlanner';
import { confidenceLabel } from '../quality/policy';

// Fixed synthetic pilot bounds, in metres. This only projects geometry onto a canvas.
export function toDisplayRoutes(routes: RouteOption[]): MockRoute[] {
  return routes.map((route, index) => ({
    id: route.id, mode: routes.length === 1 ? `${profileLabels[route.profile]} walk` : `${profileLabels[route.profile]} · Option ${index + 1}`,
    minutes: Math.ceil(route.estimated_time_s / 60), distance: Math.round(route.distance_m),
    detour: '', reasons: route.reasons, warnings: route.warnings,
    confidence: confidenceLabel(route.confidence.level), quality: 'data',
    freshness: `Verification date unknown · ${route.geometry.coordinate_system === 'WGS84' ? 'Data assessment' : 'Demo assessment'} as of ${new Date(route.confidence.as_of).toLocaleString()}`,
    dataQuality: route.data_quality, qualityFactors: route.confidence.factors,
    coordinateSystem: route.geometry.coordinate_system === 'WGS84' ? 'WGS84' : 'schematic_demo',
    geometry: route.geometry.coordinate_system === 'WGS84' ? route.geometry.coordinates : route.geometry.coordinates.map(([x, y]) => [0.12 + x / 400 * 0.76, 0.78 - (y + 150) / 450 * 0.62] as const),
  }));
}

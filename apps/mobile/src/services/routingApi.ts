export type RouteProfile = 'fastest' | 'safer_at_night' | 'step_free';
export type RoutePoint = { node_id: string } | { latitude: number; longitude: number };
export type RoutePreferences = {
  prefer_well_lit?: boolean; avoid_stairs?: boolean; avoid_steep_slopes?: boolean;
  prefer_public_areas?: boolean; max_detour_minutes?: number;
};
export type RouteRequest = {
  origin: RoutePoint; destination: RoutePoint; profile: RouteProfile;
  departure_time?: string; preferences?: RoutePreferences | null;
};
export type RouteOption = {
  id: string; profile: RouteProfile;
  geometry: { type: 'LineString'; coordinate_system: 'local_metres_not_geographic' | 'WGS84'; coordinates: [number, number][] };
  distance_m: number; estimated_time_s: number; total_cost: number;
  reasons: string[]; warnings: string[];
  confidence: { level: 'High' | 'Medium' | 'Low'; factors: string[]; as_of: string };
  verification_summary: string;
  data_quality?: {
    sources: string[]; oldest_updated_at: string | null; missing_update_count: number;
    accessibility_incomplete: boolean; stale: boolean; last_verified_at: string | null;
  };
};
export type RouteResponse = {
  dataset_id: string; data_kind: 'SIMULATED_DEMO' | 'OPENSTREETMAP'; reference_time: string; routes: RouteOption[];
};
export type RoutingErrorKind = 'timeout' | 'no_route' | 'insufficient_safety_data' | 'outside_network' | 'network' | 'invalid_response' | 'server' | 'configuration' | 'same_point';
export class RoutingApiError extends Error {
  constructor(public readonly kind: RoutingErrorKind) { super(kind); }
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(v => typeof v === 'string');
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));
function validRoute(value: unknown): value is RouteOption {
  if (!record(value) || !record(value.geometry) || !record(value.confidence)) return false;
  const g = value.geometry; const c = value.confidence; const q = value.data_quality;
  if (q !== undefined && (!record(q) || !strings(q.sources) ||
    !(q.oldest_updated_at === null || date(q.oldest_updated_at)) ||
    !(q.last_verified_at === null || date(q.last_verified_at)) ||
    !Number.isInteger(q.missing_update_count) || (q.missing_update_count as number) < 0 ||
    typeof q.accessibility_incomplete !== 'boolean' || typeof q.stale !== 'boolean')) return false;
  return typeof value.id === 'string' && value.id.length > 0 &&
    ['fastest', 'safer_at_night', 'step_free'].includes(String(value.profile)) &&
    g.type === 'LineString' && ['local_metres_not_geographic', 'WGS84'].includes(String(g.coordinate_system)) &&
    Array.isArray(g.coordinates) && g.coordinates.length >= 2 && g.coordinates.every(p => Array.isArray(p) && p.length === 2 && p.every(finite)) &&
    finite(value.distance_m) && value.distance_m > 0 && finite(value.estimated_time_s) && value.estimated_time_s > 0 &&
    finite(value.total_cost) && value.total_cost >= 0 && strings(value.reasons) && strings(value.warnings) &&
    ['High', 'Medium', 'Low'].includes(String(c.level)) && strings(c.factors) && date(c.as_of) &&
    typeof value.verification_summary === 'string';
}
export function parseRouteResponse(value: unknown): RouteResponse {
  if (!record(value) || typeof value.dataset_id !== 'string' || !['SIMULATED_DEMO', 'OPENSTREETMAP'].includes(String(value.data_kind)) ||
      !date(value.reference_time) || !Array.isArray(value.routes) || value.routes.length > 3 ||
      !value.routes.every(validRoute) || new Set(value.routes.map(r => r.id)).size !== value.routes.length ||
      value.routes.some(r => (value.data_kind === 'OPENSTREETMAP') !== (r.geometry.coordinate_system === 'WGS84')) ||
      value.routes.some(r => r.geometry.coordinate_system === 'WGS84' && r.geometry.coordinates.some(([x, y]) => Math.abs(x) > 180 || Math.abs(y) > 90))) {
    throw new RoutingApiError('invalid_response');
  }
  return value as RouteResponse;
}

export async function planRoutes(request: RouteRequest, options: {
  baseUrl?: string; timeoutMs?: number; signal?: AbortSignal;
} = {}): Promise<RouteResponse> {
  const baseUrl = options.baseUrl ?? process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) throw new RoutingApiError('configuration');
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, options.timeoutMs ?? 10000);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/routes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request), signal: controller.signal,
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 404 && record(body) && typeof body.detail === 'string') {
        throw new RoutingApiError(body.detail.includes('outside') ? 'outside_network' : body.detail.startsWith('Insufficient') ? 'insufficient_safety_data' : 'no_route');
      }
      if (response.status === 422 && record(body) && typeof body.detail === 'string' && body.detail.includes('different')) throw new RoutingApiError('same_point');
      throw new RoutingApiError('server');
    }
    const result = parseRouteResponse(await response.json());
    if (result.routes.some(r => r.profile !== request.profile)) throw new RoutingApiError('invalid_response');
    return result;
  } catch (error) {
    if (timedOut) throw new RoutingApiError('timeout');
    if (error instanceof RoutingApiError) throw error;
    if (error instanceof SyntaxError) throw new RoutingApiError('invalid_response');
    throw new RoutingApiError('network');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

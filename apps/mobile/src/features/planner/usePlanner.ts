import { useEffect, useRef, useState } from 'react';
import { planRoutes, RoutingApiError, type RouteOption, type RouteProfile, type RouteResponse } from '../../services/routingApi';

export const pilotPlaces: Record<string, string> = {
  'Transit Stop': 'transit_stop', 'Residential Block': 'residential_block',
  'Community Mall': 'mall_entrance', 'Community Plaza': 'community_plaza', 'Park Entrance': 'park_gate',
};
export const profileLabels: Record<RouteProfile, string> = {
  fastest: 'Fastest', safer_at_night: 'Safer at Night', step_free: 'Step-Free',
};
type Result = { key: string; status: 'loading' | 'ready' | 'empty' | 'error'; routes: RouteOption[]; error?: RoutingApiError };
export function usePlanner() {
  const [origin, setOrigin] = useState('Transit Stop');
  const [destination, setDestination] = useState('Residential Block');
  const [selectedProfile, setProfile] = useState<RouteProfile>('fastest');
  const [selectedId, selectRoute] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ key: '', status: 'loading', routes: [] });
  const cache = useRef(new Map<string, RouteResponse>());
  const key = `${origin}|${destination}|${selectedProfile}|${attempt}`;
  const cacheKey = `${origin}|${destination}|${selectedProfile}`;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (origin === destination) return () => { active = false; controller.abort(); };
    const cached = cache.current.get(cacheKey);
    const request = cached ? Promise.resolve(cached) : planRoutes({
      origin: { node_id: pilotPlaces[origin] }, destination: { node_id: pilotPlaces[destination] }, profile: selectedProfile,
    }, { signal: controller.signal });
    request.then(response => {
      if (!active) return;
      cache.current.set(cacheKey, response);
      setResult({ key, status: response.routes.length ? 'ready' : 'empty', routes: response.routes });
    }).catch((error: unknown) => {
      if (!active) return;
      const failure = error instanceof RoutingApiError ? error : new RoutingApiError('network');
      if (__DEV__) console.info('Routing request failed:', failure.kind);
      setResult({ key, status: failure.kind === 'no_route' ? 'empty' : 'error', routes: [], error: failure });
    });
    return () => { active = false; controller.abort(); };
  }, [key, cacheKey, origin, destination, selectedProfile]);
  const current: Result = origin === destination ? { key, status: 'empty', routes: [] } :
    result.key === key ? result : { key, status: 'loading', routes: [] };
  const selectedRoute = current.routes.find(r => r.id === selectedId) ?? current.routes[0];
  function retry() { cache.current.delete(cacheKey); setAttempt(n => n + 1); }
  return { origin, destination, setOrigin, setDestination, selectedProfile, setProfile,
    routeOptions: current.routes, selectedRoute, selectRoute, status: current.status, error: current.error, retry };
}

import { usePreferences } from '../preferences/PreferencesProvider';
import { toRoutePreferences } from '../preferences/model';
import { useEffect, useRef, useState } from 'react';
import { planRoutes, RoutingApiError, type RouteOption, type RouteProfile, type RouteResponse } from '../../services/routingApi';
import { brickfieldsPlaces, resolvePlace } from './geographic';

export const pilotPlaces = brickfieldsPlaces;
export const profileLabels: Record<RouteProfile, string> = {
  fastest: 'Fastest', safer_at_night: 'Safer at Night', step_free: 'Step-Free',
};
type Result = { key: string; status: 'loading' | 'ready' | 'empty' | 'error'; routes: RouteOption[]; error?: RoutingApiError };
export function usePlanner() {
  const { preferences } = usePreferences();
  const preferenceKey = JSON.stringify(toRoutePreferences(preferences));
  const [origin, setOrigin] = useState('KL Sentral · south entrance');
  const [destination, setDestination] = useState('NU Sentral · main entrance');
  const [selectedProfile, setProfile] = useState<RouteProfile>('fastest');
  const [selectedId, selectRoute] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ key: '', status: 'loading', routes: [] });
  const cache = useRef(new Map<string, RouteResponse>());
  const key = `${origin}|${destination}|${selectedProfile}|${preferenceKey}|${attempt}`;
  const cacheKey = `${origin}|${destination}|${selectedProfile}|${preferenceKey}`;
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    if (origin === destination) return () => { active = false; controller.abort(); };
    const cached = cache.current.get(cacheKey);
    const request = cached ? Promise.resolve(cached) : planRoutes({
      origin: resolvePlace(origin), destination: resolvePlace(destination), profile: selectedProfile, preferences: JSON.parse(preferenceKey),
    }, { signal: controller.signal });
    request.then(response => {
      if (!active) return;
      cache.current.set(cacheKey, response);
      setResult({ key, status: response.routes.length ? 'ready' : 'empty', routes: response.routes });
    }).catch((error: unknown) => {
      if (!active) return;
      const failure = error instanceof RoutingApiError ? error : new RoutingApiError('network');
      if (__DEV__) console.info('Routing request failed:', failure.kind);
      setResult({ key, status: ['no_route', 'insufficient_safety_data'].includes(failure.kind) ? 'empty' : 'error', routes: [], error: failure });
    });
    return () => { active = false; controller.abort(); };
  }, [key, cacheKey, origin, destination, selectedProfile, preferenceKey]);
  const current: Result = origin === destination ? { key, status: 'empty', routes: [], error: new RoutingApiError('same_point') } :
    result.key === key ? result : { key, status: 'loading', routes: [] };
  const selectedRoute = current.routes.find(r => r.id === selectedId) ?? current.routes[0];
  function retry() { cache.current.delete(cacheKey); setAttempt(n => n + 1); }
  return { origin, destination, setOrigin, setDestination, selectedProfile, setProfile,
    routeOptions: current.routes, selectedRoute, selectRoute, status: current.status, error: current.error, retry };
}

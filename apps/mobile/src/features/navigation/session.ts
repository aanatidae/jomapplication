import type { RouteOption, RoutePreferences, RouteRequest, RouteResponse } from '../../services/routingApi';
import { demoClosureId } from '../../services/routingApi';
import type { GeographicPoint } from '../planner/geographic';
import { distance, project, type Projection } from './geometry';

export const navigationPolicy = {
  maxAccuracyM: 35, maxFixAgeMs: 15000, signalLossMs: 20000,
  offRouteM: 35, offRouteFixes: 3, offRouteMs: 6000, rerouteCooldownMs: 20000,
  arrivalM: 20, arrivalAccuracyM: 20, arrivalFixes: 2, arrivalDwellMs: 2000,
} as const;
export type Fix = GeographicPoint & { accuracy: number | null; timestamp: number; heading?: number | null; speed?: number | null };
export type Subscription = { remove: () => void };
export type NavigationPorts = {
  permission: () => Promise<boolean>; services: () => Promise<boolean>; current: () => Promise<Fix>;
  watch: (update: (fix: Fix) => void, error: () => void) => Promise<Subscription>;
  heading?: (update: (heading: number | undefined) => void) => Promise<Subscription>;
  routes: (request: RouteRequest, options: { signal: AbortSignal }) => Promise<RouteResponse>;
  now: () => number;
};
export type NavigationState = {
  status: 'idle' | 'starting' | 'active' | 'paused' | 'arrived'; route?: RouteOption;
  position?: Fix; progress?: Projection; remainingM?: number; remainingS?: number;
  following: boolean; heading?: number; rerouting: boolean; error?: string; warning?: string;
  routeInvalidated?: boolean;
};
const initial = (): NavigationState => ({ status: 'idle', following: false, rerouting: false });
export function navigationError(error: unknown): string {
  const kind = error && typeof error === 'object' && 'kind' in error ? error.kind : '';
  if (kind === 'outside_network') return 'Your location is outside the supported pedestrian network. Choose a mapped start in Planner.';
  if (kind === 'insufficient_safety_data') return 'Insufficient environmental information for a safer night route. Your selected profile has been preserved.';
  if (kind === 'no_route') return 'No route satisfies this profile and your preferences from your current location.';
  return error instanceof Error && error.message.startsWith('Location') ? error.message : 'Route recalculation failed. Check your connection and retry. Your selected profile has been preserved.';
}

// A session owns all subscriptions and requests. Every async boundary checks a generation;
// Stop, pause, blur and a new Start invalidate pending work before disposing resources.
export class NavigationSession {
  state = initial();
  private listeners = new Set<() => void>();
  private epoch = 0;
  private routeVersion = 0;
  private demoClosure = false;
  private positionSub?: Subscription;
  private headingSub?: Subscription;
  private request?: AbortController;
  private timer?: ReturnType<typeof setInterval>;
  private destination?: GeographicPoint;
  private preferences?: RoutePreferences;
  private offRouteCount = 0;
  private offRouteSince = 0;
  private arrivalCount = 0;
  private arrivalSince = 0;
  private lastReroute = -Infinity;
  private progressAt = 0;
  constructor(private ports: NavigationPorts) {}
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  snapshot = () => this.state;
  private update(change: Partial<NavigationState>) { this.state = { ...this.state, ...change }; this.listeners.forEach(fn => fn()); }
  private cleanup() {
    this.routeVersion++;
    this.epoch++; this.positionSub?.remove(); this.positionSub = undefined;
    this.headingSub?.remove(); this.headingSub = undefined;
    this.request?.abort(); this.request = undefined;
    if (this.timer) clearInterval(this.timer); this.timer = undefined;
  }
  stop = () => { this.cleanup(); this.state = initial(); this.listeners.forEach(fn => fn()); };
  explore = () => this.update({ following: false });
  recenter = () => this.update({ following: true });
  pause = () => {
    if (!['starting', 'active'].includes(this.state.status)) return;
    this.cleanup(); this.update({ status: 'paused', rerouting: false, warning: 'Navigation paused in background. Resume when you return.', heading: undefined });
  };
  resume = async () => {
    if (this.state.status === 'paused' && this.state.route && this.destination) await this.start(this.state.route, this.destination, this.preferences, this.demoClosure);
  };
  async start(route: RouteOption, destination: GeographicPoint, preferences?: RoutePreferences, demoClosure = false) {
    if (['starting', 'active'].includes(this.state.status)) return;
    const mustRecalculate = this.state.routeInvalidated;
    this.cleanup(); const epoch = this.epoch;
    this.demoClosure = demoClosure;
    this.destination = { ...destination }; this.preferences = preferences ? { ...preferences } : undefined;
    this.offRouteCount = 0; this.arrivalCount = 0; this.lastReroute = -Infinity;
    this.progressAt = 0;
    this.update({ ...initial(), status: 'starting', route, routeInvalidated: mustRecalculate, position: undefined, progress: undefined, remainingM: undefined, remainingS: undefined, error: undefined, warning: undefined, heading: undefined });
    try {
      if (route.geometry.coordinate_system !== 'WGS84') throw new Error('Location navigation requires a geographic route.');
      if (!await this.ports.permission()) throw new Error('Location permission denied. Enable precise foreground location or use manual planning.');
      if (epoch !== this.epoch) return;
      if (!await this.ports.services()) throw new Error('Location services are disabled. Turn them on and try Start again.');
      if (epoch !== this.epoch) return;
      const fix = await this.ports.current();
      if (epoch !== this.epoch) return;
      if (!this.valid(fix)) throw new Error('Location accuracy is too low or the reading is stale. Move into an open area and retry.');
      const projection = project(fix, route.geometry.coordinates);
      this.update({ position: fix });
      // Never guide a user along a preview that starts elsewhere, or invent a connector.
      if (mustRecalculate || projection.deviation > navigationPolicy.offRouteM) {
        this.update({ rerouting: true });
        route = await this.calculate(fix, epoch);
        if (epoch !== this.epoch) return;
      }
      this.update({ status: 'active', route, routeInvalidated: false, following: true, rerouting: false });
      this.accept(fix, false);
      const sub = await this.ports.watch(value => { if (epoch === this.epoch) this.accept(value); }, () => {
        if (epoch === this.epoch) this.update({ warning: 'Location signal unavailable. Progress is paused until a reliable reading arrives.' });
      });
      if (epoch !== this.epoch) { sub.remove(); return; } this.positionSub = sub;
      this.timer = setInterval(() => {
        if (this.state.position && this.ports.now() - this.state.position.timestamp > navigationPolicy.signalLossMs) {
          this.update({ warning: 'No recent location update. You may be stationary or the GPS signal may be unavailable. Progress and arrival wait for a fresh reading.' });
        }
      }, 5000);
      if (this.ports.heading) {
        void this.ports.heading(heading => { if (epoch === this.epoch) this.update({ heading }); }).then(subscription => {
          if (epoch !== this.epoch) subscription.remove(); else this.headingSub = subscription;
        }).catch(() => {}); // Compass is optional; route following still works without it.
      }
    } catch (error) {
      if (epoch !== this.epoch) return;
      this.cleanup(); this.update({ status: 'idle', rerouting: false, following: false, error: navigationError(error) });
    }
  }
  private valid(fix: Fix) {
    return [fix.latitude, fix.longitude, fix.timestamp].every(Number.isFinite) && Math.abs(fix.latitude) <= 90 && Math.abs(fix.longitude) <= 180 &&
      fix.accuracy !== null && Number.isFinite(fix.accuracy) && fix.accuracy >= 0 && fix.accuracy <= navigationPolicy.maxAccuracyM &&
      this.ports.now() - fix.timestamp <= navigationPolicy.maxFixAgeMs && fix.timestamp <= this.ports.now() + 2000;
  }
  private accept(fix: Fix, detectArrival = true) {
    if (this.state.status !== 'active' || !this.state.route) return;
    const previous = this.state.position;
    if (previous && fix.timestamp <= previous.timestamp && detectArrival) return;
    if (!this.valid(fix)) {
      this.offRouteCount = 0; this.arrivalCount = 0;
      this.update({ warning: 'Waiting for a fresh, accurate location. Progress is paused.' }); return;
    }
    if (previous && detectArrival && distance(previous, fix) > 4 * (fix.timestamp - previous.timestamp) / 1000 + (previous.accuracy ?? 0) + (fix.accuracy ?? 0)) {
      this.offRouteCount = 0; this.arrivalCount = 0;
      this.update({ warning: 'Ignoring an implausible GPS jump. Waiting for a reliable location.' }); return;
    }
    const route = this.state.route;
    const progress = project(fix, route.geometry.coordinates, this.state.progress?.along);
    const offRoute = progress.deviation > Math.max(navigationPolicy.offRouteM, (fix.accuracy ?? 0) * 1.5);
    this.update({ position: fix, warning: undefined });
    if (this.state.routeInvalidated) return;
    if (offRoute) {
      this.arrivalCount = 0;
      if (!this.offRouteCount) this.offRouteSince = fix.timestamp;
      this.offRouteCount++;
      this.update({ warning: 'You appear to be away from the route. Checking your position…' });
      if (this.offRouteCount >= navigationPolicy.offRouteFixes && fix.timestamp - this.offRouteSince >= navigationPolicy.offRouteMs) void this.reroute();
      return;
    }
    this.offRouteCount = 0;
    if (this.state.progress && previous && Math.abs(progress.along - this.state.progress.along) >
        4 * (fix.timestamp - this.progressAt) / 1000 + (previous.accuracy ?? 0) + (fix.accuracy ?? 0)) {
      this.arrivalCount = 0;
      this.update({ warning: 'Position is ambiguous near overlapping paths. Waiting for consistent route progress.' });
      return;
    }
    // Ignore small along-route drift without moving the actual GPS marker.
    if (!this.state.progress || Math.abs(progress.along - this.state.progress.along) >= Math.min(8, fix.accuracy ?? 8)) {
      const remainingM = route.distance_m * (progress.total ? progress.remaining / progress.total : 1);
      this.progressAt = fix.timestamp;
      this.update({ progress, remainingM, remainingS: route.estimated_time_s * remainingM / route.distance_m });
    }
    if (detectArrival && this.destination && progress.remaining <= navigationPolicy.arrivalM &&
        distance(fix, this.destination) <= navigationPolicy.arrivalM && (fix.accuracy ?? Infinity) <= navigationPolicy.arrivalAccuracyM) {
      if (!this.arrivalCount) this.arrivalSince = fix.timestamp;
      this.arrivalCount++;
      if (this.arrivalCount >= navigationPolicy.arrivalFixes && fix.timestamp - this.arrivalSince >= navigationPolicy.arrivalDwellMs) {
        this.cleanup(); this.update({ status: 'arrived', following: false, rerouting: false, remainingM: 0, remainingS: 0, error: undefined, warning: undefined });
      }
    } else this.arrivalCount = 0;
  }
  private async calculate(fix: Fix, epoch: number): Promise<RouteOption> {
    if (!this.state.route || !this.destination) throw new Error('Missing session');
    this.request?.abort(); const controller = new AbortController(); this.request = controller;
    const version = this.routeVersion;
    const result = await this.ports.routes({ origin: { latitude: fix.latitude, longitude: fix.longitude }, destination: this.destination,
      profile: this.state.route.profile, preferences: this.preferences,
      ...(this.demoClosure ? { demo_closure: demoClosureId } : {}) }, { signal: controller.signal });
    const route = result.routes[0];
    if (epoch !== this.epoch || version !== this.routeVersion || !route || route.profile !== this.state.route.profile || route.geometry.coordinate_system !== 'WGS84') throw new Error('Unusable route');
    if (project(fix, route.geometry.coordinates).deviation > navigationPolicy.offRouteM) throw new Error('Location is too far from a mapped pedestrian path. Move closer to the mapped network and retry.');
    return route;
  }
  setDemoClosure = async (active: boolean): Promise<boolean> => {
    this.demoClosure = active; this.routeVersion++; this.request?.abort();
    if (this.state.status === 'idle') return true;
    const epoch = this.epoch; const version = this.routeVersion;
    if (this.state.status === 'active' && (!this.state.position || !this.valid(this.state.position))) {
      // A distance-filtered watcher can be quiet while the walker is stationary.
      // Ask the device for a real fresh fix before falling back to Planner.
      this.update({ routeInvalidated: true, rerouting: true, progress: undefined, remainingM: undefined, remainingS: undefined });
      try {
        const fix = await this.ports.current();
        if (epoch !== this.epoch || version !== this.routeVersion) return true;
        if (this.valid(fix)) this.update({ position: fix });
      } catch { /* The validity check below retains the honest Planner fallback. */ }
      if (epoch !== this.epoch || version !== this.routeVersion) return true;
    }
    if (this.state.status !== 'active' || !this.state.position || !this.valid(this.state.position)) {
      this.stop(); return false; // Planner preview is honest when a current GPS origin is unavailable.
    }
    this.update({ routeInvalidated: true, rerouting: false, progress: undefined, remainingM: undefined, remainingS: undefined });
    await this.reroute(true);
    return true;
  };
  reroute = async (force = false) => {
    if (this.state.status !== 'active' || this.state.rerouting || !this.state.position) return;
    if (!force && this.ports.now() - this.lastReroute < navigationPolicy.rerouteCooldownMs) return;
    if (!this.valid(this.state.position)) { this.update({ error: 'Location is stale. Wait for a reliable reading before retrying.' }); return; }
    this.lastReroute = this.ports.now(); const epoch = this.epoch; const version = this.routeVersion;
    this.update({ rerouting: true, error: undefined, warning: undefined });
    try {
      const route = await this.calculate(this.state.position, epoch);
      if (epoch !== this.epoch || version !== this.routeVersion) return;
      this.offRouteCount = 0; this.arrivalCount = 0;
      this.update({ route, progress: undefined, routeInvalidated: false, remainingM: undefined, remainingS: undefined, rerouting: false, error: undefined });
      if (this.state.position) this.accept(this.state.position, false);
    } catch (error) {
      if (epoch === this.epoch && version === this.routeVersion) this.update({ rerouting: false, error: navigationError(error) });
    }
  };
}

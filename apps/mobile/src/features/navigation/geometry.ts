import type { GeographicPoint } from '../planner/geographic';

export type Coordinate = readonly [number, number];
const R = 6371000;
const radians = Math.PI / 180;
export function distance(a: GeographicPoint, b: GeographicPoint): number {
  const x = (b.longitude - a.longitude) * radians * Math.cos((a.latitude + b.latitude) / 2 * radians);
  const y = (b.latitude - a.latitude) * radians;
  return Math.hypot(x, y) * R;
}
export const point = ([longitude, latitude]: Coordinate): GeographicPoint => ({ longitude, latitude });
export type Projection = { along: number; remaining: number; deviation: number; total: number; coordinate: Coordinate; segment: number };

// Local tangent-plane projection is suitable for this bounded 2 km pedestrian pilot.
// A previous along-distance breaks ties at intersecting/overlapping segments.
export function project(position: GeographicPoint, coordinates: readonly Coordinate[], previous = 0): Projection {
  let cumulative = 0;
  let best: Projection = { along: 0, remaining: 0, deviation: Infinity, total: 0, coordinate: coordinates[0], segment: 0 };
  const sx = R * radians * Math.cos(position.latitude * radians), sy = R * radians;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const a = coordinates[i], b = coordinates[i + 1];
    const ax = (a[0] - position.longitude) * sx, ay = (a[1] - position.latitude) * sy;
    const dx = (b[0] - a[0]) * sx, dy = (b[1] - a[1]) * sy;
    const length = Math.hypot(dx, dy);
    const t = length ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / (length * length))) : 0;
    const deviation = Math.hypot(ax + t * dx, ay + t * dy), along = cumulative + t * length;
    if (deviation < best.deviation - 2 || (Math.abs(deviation - best.deviation) <= 2 && Math.abs(along - previous) < Math.abs(best.along - previous))) {
      best = { along, deviation, remaining: 0, total: 0, coordinate: [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])], segment: i };
    }
    cumulative += length;
  }
  return { ...best, total: cumulative, remaining: Math.max(0, cumulative - best.along) };
}
export function remainingGeometry(coordinates: readonly Coordinate[], projection?: Projection): Coordinate[] {
  return projection ? [projection.coordinate, ...coordinates.slice(projection.segment + 1)] : [...coordinates];
}

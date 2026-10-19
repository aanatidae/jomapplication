import type { RoutePoint } from '../../services/routingApi';
import catalog from './destinations.json';

export type GeographicPoint = { latitude: number; longitude: number };
export const brickfieldsCenter: GeographicPoint = { latitude: 3.1334, longitude: 101.6869 };
// Copied from the importer catalogue; includes source OSM references for each landmark.
export const brickfieldsPlaces: Record<string, GeographicPoint> = Object.fromEntries(
  catalog.map(place => [place.label, { latitude: place.latitude, longitude: place.longitude }]),
);
export function pointLabel(point: GeographicPoint): string {
  return `${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}`;
}
export function resolvePlace(label: string): RoutePoint {
  const place = brickfieldsPlaces[label];
  if (place) return place;
  const values = label.split(',').map(Number);
  if (values.length === 2 && values.every(Number.isFinite)) return { latitude: values[0], longitude: values[1] };
  throw new Error('Choose a mapped place or a location on the map.');
}
export function geographicPoint(label: string): GeographicPoint | undefined {
  try { const point = resolvePlace(label); return 'latitude' in point ? point as GeographicPoint : undefined; } catch { return undefined; }
}
export function validMapPoint(point: readonly number[], system: string): boolean {
  if (point.length !== 2 || !point.every(Number.isFinite)) return false;
  const [x, y] = point;
  return system === 'WGS84' ? x >= -180 && x <= 180 && y >= -90 && y <= 90 :
    system === 'schematic_demo' && x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

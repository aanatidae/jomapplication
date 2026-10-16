import { routes } from '../planner/mockRoutes';
import type { CommunityRoute, SharedPath } from './types';
export const seedPaths: SharedPath[] = routes.map(r => ({ id: `demo-${r.id}`, label: `${r.mode} demo route`, origin: 'Transit Stop', destination: 'Residential Block', geometry: r.geometry, distanceM: r.distance, durationMinutes: r.minutes, coordinateSystem: 'schematic_demo' }));
export const seededCommunityRoutes: CommunityRoute[] = [
  { id: 'plaza-walk', author: 'Jom! demo contributor', title: 'An evening walk through the plaza', notes: 'Simulated route through the public plaza. Check crossing conditions and opening hours before walking.', purposeTags: ['Walking', 'Scenic'], route: seedPaths[1], accessibilityTags: [], routeWarnings: ['Accessibility information incomplete'], photos: [], lastWalkedAt: '2026-10-15', createdAt: '2026-10-15T12:00:00Z', verificationLevel: 'community_submitted' },
  { id: 'ramp-loop', author: 'Jom! demo contributor', title: 'The ramp connection', notes: 'Illustrative step-free alternative. Conditions and entrances need checking on the day.', purposeTags: ['Accessible', 'Walking'], route: seedPaths[2], accessibilityTags: ['Step-free', 'Ramp available'], routeWarnings: [], photos: [], createdAt: '2026-10-14T12:00:00Z', verificationLevel: 'community_submitted' },
];
// Only an explicitly chosen route is held in memory; no background route history.
let selectedPath: SharedPath | null = null;
export function setSharePath(path: SharedPath) { selectedPath = path; }
export function getSharePath() { return selectedPath; }

import type { Point } from '../planner/mockRoutes';
export type VerificationLevel = 'community_submitted' | 'confirmed' | 'verified';
export type SharedPath = { id: string; label: string; origin: string; destination: string; geometry: readonly Point[]; distanceM: number; durationMinutes: number; coordinateSystem: 'schematic_demo' | 'WGS84' };
export type CommunityRoute = {
  id: string; author: string; title: string; notes: string; purposeTags: string[];
  route: SharedPath; accessibilityTags: string[]; routeWarnings: string[]; photos: string[];
  lastWalkedAt?: string; createdAt: string; verificationLevel: VerificationLevel;
};
export type CreateCommunityRouteInput = Pick<CommunityRoute, 'title' | 'notes' | 'purposeTags' | 'accessibilityTags' | 'routeWarnings' | 'photos' | 'lastWalkedAt'> & { route: SharedPath | null };
export interface CommunityRouteRepository {
  listRoutes(): Promise<CommunityRoute[]>;
  getRoute(id: string): Promise<CommunityRoute | null>;
  createRoute(input: CreateCommunityRouteInput): Promise<CommunityRoute>;
}
export const purposeTags = ['Walking', 'Jogging', 'Shortcut', 'Accessible', 'Scenic', 'Covered'];
export const accessibilityTags = ['Step-free', 'Ramp available', 'Elevator required', 'Accessible entrance', 'Stairs present'];
export const routeWarnings = ['Steep section', 'Construction nearby', 'Narrow path', 'Poor lighting reported', 'Lift may be unavailable'];

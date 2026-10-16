import type { VerificationLevel, SharedPath } from '../community/types';
export const barrierCategories = {
  blocked_walkway: 'Broken or blocked walkway', lift_unavailable: 'Lift unavailable',
  missing_ramp: 'Missing or blocked ramp', construction: 'Construction',
  poor_lighting: 'Poor lighting', flooded_path: 'Flooded path',
  unsafe_crossing: 'Unsafe crossing', incorrect_map: 'Incorrect map connection',
} as const;
export type BarrierCategory = keyof typeof barrierCategories;
export type ConditionType = 'temporary' | 'permanent' | 'unknown';
export type ReportLocation = { label: string; coordinateSystem: 'schematic_demo'; point: readonly [number, number]; routeId?: string; waypointIndex?: number };
export type BarrierReport = {
  id: string; category: BarrierCategory; location: ReportLocation; description: string;
  photoUri?: string; reportedAt: string; conditionType: ConditionType;
  verificationLevel: VerificationLevel; expiresAt?: string;
};
export type CreateBarrierReportInput = { category: BarrierCategory | null; location: ReportLocation | null; description: string; photoUri?: string; conditionType: ConditionType };
export interface BarrierReportRepository {
  listReports(): Promise<BarrierReport[]>;
  createReport(input: CreateBarrierReportInput): Promise<BarrierReport>;
}
let activeRoute: SharedPath | null = null;
export function setReportRoute(route: SharedPath | null) { activeRoute = route; }
export function getReportRoute() { return activeRoute; }
export function routeLocations(route: SharedPath | null): ReportLocation[] {
  return route ? route.geometry.map((point, index) => ({ label: `Route point ${index + 1}${index === 0 ? ` · ${route.origin}` : index === route.geometry.length - 1 ? ` · ${route.destination}` : ''}`, point, coordinateSystem: 'schematic_demo', routeId: route.id, waypointIndex: index })) :
    [{ label: 'Transit Stop · deterministic demo location', point: [0.16, 0.75], coordinateSystem: 'schematic_demo' }];
}

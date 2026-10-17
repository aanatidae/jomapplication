// Schema-aligned types maintained locally until CLI generation is available.
// Regenerate against the applied migration; see supabase/README.md.
import type { SharedPath, VerificationLevel } from '../features/community/types';
import type { BarrierCategory, ConditionType, ReportLocation } from '../features/barriers/model';
export type ProfileRow = {
  id: string; prefer_well_lit: boolean; avoid_stairs: boolean; avoid_steep_slopes: boolean;
  prefer_ramps_elevators: boolean; prefer_public_areas: boolean; prefer_covered_paths: boolean;
  max_detour_minutes: number | null; onboarding_completed: boolean; created_at: string; updated_at: string;
};
export type CommunityRow = {
  id: string; user_id: string; title: string; notes: string; purpose_tags: string[];
  route: SharedPath; accessibility_tags: string[]; warnings: string[]; photo_path: string | null;
  last_walked_at: string | null; verification_level: VerificationLevel; published: boolean;
  created_at: string; updated_at: string;
};
export type BarrierRow = {
  id: string; user_id: string; category: BarrierCategory; location: ReportLocation; description: string;
  condition_type: ConditionType; reported_at: string; expires_at: string | null; photo_path: string | null;
  verification_level: VerificationLevel; published: boolean; created_at: string; updated_at: string;
};
type Table<Row, Required extends keyof Row> = {
  Row: Row; Insert: Pick<Row, Required> & Partial<Row>; Update: Partial<Row>; Relationships: [];
};
export type Database = { public: {
  Tables: {
    profiles: Table<ProfileRow, 'id'>;
    community_routes: Table<CommunityRow, 'user_id' | 'title' | 'purpose_tags' | 'route'>;
    barrier_reports: Table<BarrierRow, 'user_id' | 'category' | 'location' | 'description' | 'condition_type'>;
  };
  Views: Record<string, never>; Functions: Record<string, never>;
  Enums: Record<string, never>; CompositeTypes: Record<string, never>;
} };

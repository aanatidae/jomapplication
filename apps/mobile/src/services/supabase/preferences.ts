import type { SupabaseClient } from '@supabase/supabase-js';
import { initialPreferenceState, type PreferenceState } from '../../features/preferences/localRepository';
import type { Database, ProfileRow } from '../../types/database.types';
import { requireUser } from './auth';
import { appError } from './errors';

export function mapProfile(row: ProfileRow): PreferenceState {
  return { onboardingCompleted: row.onboarding_completed, preferences: {
    preferWellLit: row.prefer_well_lit, avoidStairs: row.avoid_stairs, avoidSteepSlopes: row.avoid_steep_slopes,
    preferRampsElevators: row.prefer_ramps_elevators, preferPublicAreas: row.prefer_public_areas,
    preferCoveredPaths: row.prefer_covered_paths,
    ...(row.max_detour_minutes === null ? {} : { maxDetourMinutes: row.max_detour_minutes }),
  } };
}
export class SupabaseUserPreferencesRepository {
  constructor(private client: SupabaseClient<Database>) {}
  async load(): Promise<PreferenceState> {
    try {
      const id = await requireUser(this.client);
      const { data, error } = await this.client.from('profiles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data ? mapProfile(data) : initialPreferenceState;
    } catch (error) { throw appError('load preferences', error); }
  }
  async save(value: PreferenceState): Promise<void> {
    try {
      const id = await requireUser(this.client);
      const p = value.preferences;
      const { error } = await this.client.from('profiles').upsert({ id,
        onboarding_completed: value.onboardingCompleted, prefer_well_lit: p.preferWellLit,
        avoid_stairs: p.avoidStairs, avoid_steep_slopes: p.avoidSteepSlopes,
        prefer_ramps_elevators: p.preferRampsElevators, prefer_public_areas: p.preferPublicAreas,
        prefer_covered_paths: p.preferCoveredPaths, max_detour_minutes: p.maxDetourMinutes ?? null,
      }, { onConflict: 'id' });
      if (error) throw error;
    } catch (error) { throw appError('save preferences', error); }
  }
}

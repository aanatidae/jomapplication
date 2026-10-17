import { isLocalDemo } from '../../services/persistenceMode';
import { getSupabase } from '../../services/supabase/client';
import { SupabaseUserPreferencesRepository } from '../../services/supabase/preferences';
import { createPreferenceRepository } from './localRepository';
export * from './localRepository';
export type UserPreferencesRepository = ReturnType<typeof createPreferenceRepository>;
export const preferenceRepository: UserPreferencesRepository = isLocalDemo ? createPreferenceRepository() : {
  load: () => new SupabaseUserPreferencesRepository(getSupabase()).load(),
  save: value => new SupabaseUserPreferencesRepository(getSupabase()).save(value),
};

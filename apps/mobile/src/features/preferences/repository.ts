import { localStorage, type KeyValueStorage } from '../../services/localStorage';
import { defaultPreferences, type UserRoutePreferences } from './model';
export type PreferenceState = { onboardingCompleted: boolean; preferences: UserRoutePreferences };
export const initialPreferenceState: PreferenceState = { onboardingCompleted: false, preferences: defaultPreferences };
export function createPreferenceRepository(storage: KeyValueStorage = localStorage) {
  const key = 'jom.preferences.v1';
  return {
    async load(): Promise<PreferenceState> {
      const raw = await storage.getItem(key);
      if (!raw) return initialPreferenceState;
      const value = JSON.parse(raw) as PreferenceState;
      if (typeof value.onboardingCompleted !== 'boolean' || !value.preferences) throw new Error('Invalid preferences');
      const preferences = { ...defaultPreferences };
      for (const [name] of Object.entries(defaultPreferences)) {
        const k = name as keyof typeof defaultPreferences;
        if (typeof value.preferences[k] !== 'boolean') throw new Error('Invalid preferences');
        Object.assign(preferences, { [k]: value.preferences[k] });
      }
      const detour = value.preferences.maxDetourMinutes;
      if (detour !== undefined) {
        if (!Number.isInteger(detour) || detour < 0 || detour > 60) throw new Error('Invalid detour');
        preferences.maxDetourMinutes = detour;
      }
      return { onboardingCompleted: value.onboardingCompleted, preferences };
    },
    async save(value: PreferenceState) { await storage.setItem(key, JSON.stringify(value)); },
  };
}
export const preferenceRepository = createPreferenceRepository();

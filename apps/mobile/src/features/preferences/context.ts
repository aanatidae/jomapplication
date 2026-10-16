import { createContext, useContext } from 'react';
import { defaultPreferences, type UserRoutePreferences } from './model';
export const PreferencesContext = createContext({ preferences: defaultPreferences, save: async (_p: UserRoutePreferences) => {}, restartOnboarding: async () => {} });
export function usePreferences() { return useContext(PreferencesContext); }

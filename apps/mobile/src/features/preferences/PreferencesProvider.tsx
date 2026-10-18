import { useEffect, useState, type ReactNode } from 'react';
import { Text } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { ErrorText, FormPage } from '../../components/Forms';
import { type } from '../../theme/tokens';
import { type UserRoutePreferences } from './model';
import { initialPreferenceState, preferenceRepository, type PreferenceState } from './repository';
import { OnboardingScreen } from './Screens';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreferencesContext } from './context';
export { usePreferences } from './context';
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PreferenceState>(initialPreferenceState);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  async function load() {
    setStatus('loading');
    try { setState(await preferenceRepository.load()); setStatus('ready'); } catch { setStatus('error'); }
  }
  useEffect(() => {
    let active = true;
    preferenceRepository.load().then(value => { if (active) { setState(value); setStatus('ready'); } }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, []);
  async function save(preferences: UserRoutePreferences) {
    const next = { onboardingCompleted: true, preferences };
    await preferenceRepository.save(next); setState(next);
  }
  async function restartOnboarding() { await preferenceRepository.save(initialPreferenceState); setState(initialPreferenceState); }
  if (status !== 'ready') return <SafeAreaView style={{ flex: 1 }}><FormPage title="Jom!">{status === 'loading' ? <Text style={type.body}>Loading your preferences…</Text> : <>
    <ErrorText text="Couldn't read preferences. Retry without losing your settings."/><SecondaryButton label="Retry" onPress={() => void load()}/></>}</FormPage></SafeAreaView>;
  return <PreferencesContext value={{ preferences: state.preferences, save, restartOnboarding }}>
    {state.onboardingCompleted ? children : <SafeAreaView style={{ flex: 1 }}><OnboardingScreen onComplete={save}/></SafeAreaView>}
  </PreferencesContext>;
}

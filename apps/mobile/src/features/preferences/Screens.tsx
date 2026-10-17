import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { ErrorText, FormPage, form } from '../../components/Forms';
import { type } from '../../theme/tokens';
import { defaultPreferences, type UserRoutePreferences } from './model';
import { PreferenceFields } from './PreferenceFields';
import { usePreferences } from './context';
export function OnboardingScreen({ onComplete, labels }: { labels?: Record<string, string>; onComplete: (p: UserRoutePreferences) => Promise<void> }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState({ ...defaultPreferences });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function finish(p = draft) { setBusy(true); setError(''); try { await onComplete(p); } catch { setError("Couldn't save preferences. Try again."); } finally { setBusy(false); } }
  return <FormPage title={['Welcome to Jom!', 'What matters on your walk?', 'Move your way'][step]}>
    <Text style={type.caption}>Step {step + 1} of 3</Text>
    {step === 0 ? <><Text style={type.display}>The shortest route isn’t always the best route for you.</Text>
      <Text style={type.body}>Jom! helps you choose walking routes based on time, accessibility, route conditions and what matters to you.</Text>
      <Text style={type.caption}>Compare available information. Conditions can change.</Text></> :
      <PreferenceFields labels={labels} value={draft} onChange={setDraft} section={step === 1 ? 'walking' : 'mobility'}/>}
    {error ? <ErrorText text={error}/> : null}
    <PrimaryButton disabled={busy} label={busy ? 'Saving…' : step === 2 ? 'Finish onboarding' : 'Continue'} onPress={() => step === 2 ? void finish() : setStep(step + 1)}/>
    {step > 0 && <SecondaryButton label="Back" disabled={busy} onPress={() => setStep(step - 1)}/>}
    <SecondaryButton disabled={busy} label={step === 0 ? 'Skip setup' : 'Skip remaining setup'} onPress={() => void finish(step === 0 ? defaultPreferences : draft)}/>
  </FormPage>;
}
export function ProfileScreen() {
  const { preferences, save, restartOnboarding } = usePreferences();
  const [draft, setDraft] = useState({ ...preferences }); const [message, setMessage] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit() { setBusy(true); setError(''); try { await save(draft); setMessage('Preferences saved. Future route requests use these settings.'); } catch { setError("Couldn't save. Your edits are still here; try again."); } finally { setBusy(false); } }
  return <FormPage title="Profile"><Text style={type.body}>Your walking preferences</Text>
    <Text style={type.caption}>Your preferences are saved for your current demo or guest identity. No IC or age information is collected.</Text>
    <PreferenceFields value={draft} onChange={p => { setDraft(p); setMessage(''); }}/>
    {error ? <ErrorText text={error}/> : null}{message ? <Text accessibilityLiveRegion="polite" style={type.body}>{message}</Text> : null}
    <PrimaryButton label={busy ? 'Saving…' : 'Save preferences'} disabled={busy} onPress={() => void submit()}/>
    <View style={form.panel}><Text style={type.caption}>Reset clears the selections in this form. Save to apply.</Text>
      <SecondaryButton label="Reset preferences" disabled={busy} onPress={() => { setDraft({ ...defaultPreferences }); setMessage(''); }}/></View>
    {__DEV__ && <View style={form.panel}><Text style={type.title}>Development previews</Text>
      <Text style={type.caption}>Restart setup clears this identity’s walking preferences. Shared routes and reports remain.</Text>
      <SecondaryButton label="Restart onboarding demo" onPress={() => { void restartOnboarding().catch(() => setError("Couldn't restart setup. Try again.")); }}/>

      {['onboarding', 'community', 'detail', 'share', 'barrier'].map(surface => <SecondaryButton key={surface} label={`Stress test ${surface}`} onPress={() => router.push({ pathname: '/stress', params: { surface } })}/>)}</View>}

  </FormPage>;
}

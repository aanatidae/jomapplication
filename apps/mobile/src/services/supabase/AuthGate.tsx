import { useEffect, useState, type ReactNode } from 'react';
import { AppState, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { ErrorText, FormPage } from '../../components/Forms';
import { type } from '../../theme/tokens';
import { isLocalDemo } from '../persistenceMode';
import { getSupabase } from './client';
import { restoreIdentity, signInGuest, type AuthStatus } from './auth';

export function AuthGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [userId, setUserId] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (isLocalDemo) return;
    let active = true;
    let release = () => {};
    void Promise.resolve().then(() => {
      if (!active) return null;
      const client = getSupabase();
      const subscription = client.auth.onAuthStateChange((_event, session) => {
        if (active) { setUserId(session?.user.id ?? ''); setStatus(session ? 'signed_in' : 'signed_out'); }
      }).data.subscription;
      const refresh = (state: string) => { if (state === 'active') client.auth.startAutoRefresh(); else client.auth.stopAutoRefresh(); };
      refresh(AppState.currentState);
      const listener = AppState.addEventListener('change', refresh);
      release = () => { subscription.unsubscribe(); listener.remove(); client.auth.stopAutoRefresh(); };
      return restoreIdentity(client);
    }).then(session => {
      if (active) { setUserId(session?.user.id ?? ''); setStatus(session ? 'signed_in' : 'signed_out'); }
    }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; release(); };
  }, [attempt]);
  async function start() {
    if (busy) return;
    setBusy(true);
    try {
      const session = await signInGuest(getSupabase());
      setUserId(session.user.id); setStatus('signed_in');
    } catch { setStatus('error'); } finally { setBusy(false); }
  }
  if (isLocalDemo) return children;
  // Remount user-specific preference state whenever identity changes.
  if (status === 'signed_in') return <SignedIn key={userId}>{children}</SignedIn>;
  return <SafeAreaView style={{ flex: 1 }}><FormPage title="Welcome to Jom!">
    {status === 'loading' ? <Text style={type.body}>Restoring your guest session…</Text> : status === 'error' ? <>
      <ErrorText text="Couldn't connect your guest session. Check your connection and project configuration, then retry."/>
      <SecondaryButton label="Retry connection" onPress={() => { setStatus('loading'); setAttempt(n => n + 1); }}/>
    </> : <>
      <Text style={type.body}>Continue as a guest to save preferences and share community updates.</Text>
      <Text style={type.caption}>Your guest identity stays on this device. Reinstalling or clearing app storage can lose access to it. Photos are public; avoid personal information.</Text>
      <PrimaryButton label={busy ? 'Starting guest session…' : 'Continue as guest'} disabled={busy} onPress={() => void start()}/>
    </>}
  </FormPage></SafeAreaView>;
}
function SignedIn({ children }: { children: ReactNode }) { return children; }

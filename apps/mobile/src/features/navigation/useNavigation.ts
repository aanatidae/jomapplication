import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { NavigationSession } from './session';
import { locationPorts } from './location';

export function useNavigation() {
  const [session] = useState(() => new NavigationSession(locationPorts));
  const state = useSyncExternalStore(session.subscribe, session.snapshot, session.snapshot);
  const pathname = usePathname();
  useEffect(() => { if (pathname && pathname !== '/') session.stop(); }, [pathname, session]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      if (next === 'active') void session.resume(); else session.pause();
    });
    return () => { sub.remove(); session.stop(); };
  }, [session]);
  return { state, session };
}

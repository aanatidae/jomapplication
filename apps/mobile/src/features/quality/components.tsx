import { useEffect, useState } from 'react';
import { AppState, Text } from 'react-native';
import { theme, type } from '../../theme/tokens';
import { relativeDate } from './policy';

// Refresh while a screen remains open and immediately after returning from background.
export function useQualityClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = setInterval(refresh, 30000);
    const subscription = AppState.addEventListener('change', refresh);
    return () => { clearInterval(timer); subscription.remove(); };
  }, []);
  return now;
}
export function FreshnessLabel({ date, kind, now }: { date?: string; kind: 'Verified' | 'Last updated' | 'Last walked' | 'Community reported'; now: number }) {
  const relative = relativeDate(date, now);
  return <Text style={type.caption}>{relative === 'date unknown' ? `${kind === 'Verified' ? 'Verification' : kind} date unknown` : `${kind} ${relative}`}</Text>;
}
export function RouteWarningBanner({ text }: { text: string }) {
  return <Text style={[type.caption, { color: theme.color.warning }]}>{text}</Text>;
}
export function AccessibilityStatus({ incomplete }: { incomplete?: boolean }) {
  return <Text style={type.caption}>{incomplete === true ? 'Accessibility information incomplete' : incomplete === false ? 'Accessibility attributes recorded · conditions may change' : 'Accessibility verification unavailable'}</Text>;
}

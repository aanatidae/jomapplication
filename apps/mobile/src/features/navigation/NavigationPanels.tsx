import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import type { NavigationState } from './session';
import { profileLabels } from '../planner/usePlanner';
import { useState } from 'react';

export function NavigationGuidance({ state, destination }: { state: NavigationState; destination: string }) {
  return <ScrollView style={styles.guidance} contentContainerStyle={styles.panel}>
    <Text accessibilityRole="header" style={styles.guidanceTitle}>{state.status === 'arrived' ? 'You have arrived' : state.rerouting ? 'Recalculating route' : state.status === 'starting' ? 'Preparing navigation' : state.status === 'paused' ? 'Navigation paused' : 'Follow the route'}</Text>
    <Text style={styles.destination}>{destination}</Text>
    {!!state.warning && <Text accessibilityLiveRegion="polite" style={styles.warning}>{state.warning}</Text>}
  </ScrollView>;
}
export function NavigationProgress({ state, onStop, onResume, onRetry }: {
  state: NavigationState; onStop: () => void; onResume: () => void; onRetry: () => void;
}) {
  const [details, setDetails] = useState(false);
  const largeText = useWindowDimensions().fontScale > 1.5;
  const remaining = state.remainingM;
  const minutes = state.remainingS === undefined ? undefined : Math.ceil(state.remainingS / 60);
  const arrival = state.remainingS === undefined || !state.position ? undefined : new Date(state.position.timestamp + state.remainingS * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const progress = state.status === 'arrived' ? 100 : state.progress && state.progress.total > 0
    ? Math.round(Math.max(0, Math.min(1, state.progress.along / state.progress.total)) * 100) : undefined;
  const metrics = <>
    <Text accessibilityRole="header" style={styles.metrics}>{state.status === 'arrived' ? 'Walk complete' : remaining === undefined ? 'Waiting for route progress' : `${Math.round(remaining)} m · ${minutes} min left`}</Text>
    {arrival && state.status !== 'arrived' && <Text style={type.caption}>Estimated arrival {arrival}</Text>}
    <Text style={type.caption}>{state.position?.accuracy != null ? `Location accuracy ±${Math.round(state.position.accuracy)} m` : 'Waiting for accurate GPS'}</Text>
  </>;
  return <View style={styles.bottom}>
    <View style={styles.summary}>
      {!largeText && <View style={styles.stats}>{metrics}</View>}
      <SecondaryButton label={state.status === 'arrived' ? 'Return to Planner' : 'Stop Navigation'} onPress={onStop}/>
    </View>
      {progress !== undefined && <View accessible accessibilityRole="progressbar" accessibilityLabel="Walk progress"
        accessibilityValue={{ min: 0, max: 100, now: progress }} style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]}/>
      </View>}
    <ScrollView style={styles.details} contentContainerStyle={styles.detailContent}>
      {largeText && metrics}
      <SecondaryButton label={details ? 'Hide walking details' : 'Walking details'} accessibilityState={{ expanded: details }} onPress={() => setDetails(value => !value)}/>
      {details && <>
        <Text style={type.caption}>{state.route && profileLabels[state.route.profile]} · Route-following guidance. Turn-by-turn instructions unavailable.</Text>
        <Text style={type.caption}>Foreground tracking only. Check crossings and mapped endpoint gaps. Walking time is an estimate.</Text>
        {state.route?.reasons.map((reason, index) => <Text key={`reason-${index}`} style={type.caption}>{reason}</Text>)}
        {state.route?.warnings.map((warning, index) => <Text key={`warning-${index}`} style={styles.caveat}>{warning}</Text>)}
        {state.route && <Text style={type.caption}>{state.route.confidence.level} data confidence · {state.route.verification_summary}</Text>}
      </>}
      {!!state.error && <><Text accessibilityLiveRegion="assertive" style={[type.body, styles.error]}>{state.error}</Text>
        <SecondaryButton label="Retry route" disabled={state.rerouting} onPress={onRetry}/>
        <Text style={type.caption}>Retries are limited to one every 20 seconds.</Text></>}
      {state.status === 'paused' && <PrimaryButton label="Resume navigation" onPress={onResume}/>}
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  guidance: { flexGrow: 0, margin: theme.space.sm, borderRadius: theme.radius.lg, backgroundColor: theme.color.surface, ...theme.elevation.sheet },
  guidanceTitle: { ...type.title, color: theme.color.accent },
  destination: { ...type.body, fontWeight: '600' },
  warning: { ...type.body, color: theme.color.warning, backgroundColor: theme.color.safetySurface, borderRadius: theme.radius.sm, padding: theme.space.xs },
  metrics: { ...type.title, color: theme.color.accent, fontVariant: ['tabular-nums'] },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.xs, padding: theme.space.sm },
  stats: { flexGrow: 1, flexShrink: 1, minWidth: 160, gap: theme.space.xxs },
  track: { height: 4, backgroundColor: theme.color.raised, borderRadius: theme.radius.pill, overflow: 'hidden', marginHorizontal: theme.space.sm },
  fill: { height: '100%', backgroundColor: theme.color.accent, borderRadius: theme.radius.pill },
  panel: { padding: theme.space.sm, gap: theme.space.xxs },
  details: { flexGrow: 0, flexShrink: 1 },
  detailContent: { paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs, gap: theme.space.xs },
  bottom: { flexShrink: 1, backgroundColor: theme.color.surface, borderTopLeftRadius: theme.radius.sheet, borderTopRightRadius: theme.radius.sheet, ...theme.elevation.sheet },
  caveat: { ...type.caption, color: theme.color.warning }, error: { color: theme.color.error },
});

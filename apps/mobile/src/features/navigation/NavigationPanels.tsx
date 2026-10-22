import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import type { NavigationState } from './session';
import { profileLabels } from '../planner/usePlanner';
import { useState, type ReactNode } from 'react';
import { MotionPressable } from '../motion/Motion';
import { reliableNavigationDisplay } from './presentation';

export function NavigationGuidance({ state, destination }: { state: NavigationState; destination: string }) {
  const [expanded, setExpanded] = useState(false);
  const [focused, setFocused] = useState(false);
  const [warningExpanded, setWarningExpanded] = useState(false);
  const largeText = useWindowDimensions().fontScale > 1.5;
  return <ScrollView style={styles.guidance} contentContainerStyle={styles.panel}>
    <MotionPressable accessibilityRole="button" accessibilityLabel={`Destination: ${destination}`} accessibilityHint="Expand or collapse the full destination name" accessibilityState={{ expanded }}
      onPress={() => setExpanded(value => !value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={({ pressed }) => [styles.destinationButton, focused && { borderColor: theme.color.focus }, pressed && { backgroundColor: theme.color.selected }]}>
      <View style={styles.destinationText}>
        <Text accessibilityRole="header" style={styles.guidanceTitle}>{state.status === 'arrived' ? 'You have arrived' : state.rerouting ? 'Recalculating route' : state.routeInvalidated ? 'Waiting for an alternative route' : state.status === 'starting' ? 'Preparing navigation' : state.status === 'paused' ? 'Navigation paused' : 'Follow the route'}</Text>
        <Text numberOfLines={expanded || largeText ? undefined : 1} style={styles.destination}>{destination}</Text>
      </View>
      <Text accessible={false} style={styles.chevron}>{expanded ? '−' : '+'}</Text>
    </MotionPressable>
    {!!state.warning && <View style={styles.warning}>
      <MotionPressable accessibilityRole="button" accessibilityLabel={`Location warning: ${state.warning}`} accessibilityState={{ expanded: warningExpanded }}
        onPress={() => setWarningExpanded(value => !value)} style={({ pressed }) => [styles.warningToggle, pressed && { opacity: 0.7 }]}>
        <Text accessibilityLiveRegion="polite" style={styles.warningTitle}>Location uncertain · {warningExpanded ? 'hide details' : 'details'}</Text>
      </MotionPressable>
      {warningExpanded && <Text style={styles.warningText}>{state.warning}</Text>}
    </View>}
  </ScrollView>;
}
export function NavigationProgress({ state, onStop, onResume, onRetry, onReport, notice, now }: {
  state: NavigationState; onStop: () => void; onResume: () => void; onRetry: () => void;
  onReport?: () => void; notice?: ReactNode;
  now?: number;
}) {
  const [details, setDetails] = useState(false);
  const [initialNow] = useState(Date.now);
  const displayNow = now ?? initialNow;
  const largeText = useWindowDimensions().fontScale > 1.5;
  const remaining = state.remainingM;
  const minutes = state.remainingS === undefined ? undefined : Math.ceil(state.remainingS / 60);
  const reliable = reliableNavigationDisplay(state, displayNow);
  const arrival = state.remainingS === undefined || !reliable ? undefined : new Date(displayNow + state.remainingS * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const progress = state.status === 'arrived' ? 100 : state.progress && state.progress.total > 0
    ? Math.round(Math.max(0, Math.min(1, state.progress.along / state.progress.total)) * 100) : undefined;
  const metrics = <>
    <Text accessibilityRole="header" style={styles.metrics}>{state.status === 'arrived' ? 'Walk complete' : remaining === undefined ? 'Waiting for route progress' : <>{Math.round(remaining)} m<Text style={styles.time}> · {minutes} min left</Text></>}</Text>
    <View style={styles.meta}>
    {arrival && state.status !== 'arrived' && <Text style={type.caption}>Estimated arrival {arrival}</Text>}
    {!reliable && state.status !== 'arrived' && <Text style={styles.caveat}>Arrival waits for reliable GPS</Text>}
    <Text style={type.caption}>{state.position?.accuracy != null ? `Location accuracy ±${Math.round(state.position.accuracy)} m` : 'Waiting for accurate GPS'}</Text>
    </View>
  </>;
  return <View style={styles.bottom}>
    <View style={styles.summary}>
      <View style={styles.metricsRow}>
        {!largeText && <View style={styles.stats}>{metrics}</View>}
        <MotionPressable accessibilityRole="button" accessibilityLabel={details ? 'Hide walking details' : 'Walking details'} accessibilityState={{ expanded: details }}
          onPress={() => setDetails(value => !value)} style={({ pressed }) => [styles.detailsToggle, pressed && { backgroundColor: theme.color.selected }]}>
          <Text style={styles.detailsLabel}>{details ? 'Less' : 'Details'}</Text>
        </MotionPressable>
      </View>
      <View style={styles.actions}>
        <View style={styles.action}><SecondaryButton label={state.status === 'arrived' ? 'Return to Planner' : 'Stop Navigation'} onPress={onStop}/></View>
        {onReport && <View style={styles.action}><SecondaryButton label="Report Barrier" onPress={onReport}/></View>}
      </View>
    </View>
      {progress !== undefined && <View accessible accessibilityRole="progressbar" accessibilityLabel="Walk progress"
        accessibilityValue={{ min: 0, max: 100, now: progress }} style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%` }]}/>
      </View>}
    {(notice || largeText || details || state.error || state.status === 'paused') && <ScrollView style={styles.details} contentContainerStyle={styles.detailContent}>
      {notice}
      {largeText && metrics}
      {details && <>
        <Text style={type.caption}>{state.route && profileLabels[state.route.profile]} · Route-following guidance. Turn-by-turn instructions unavailable.</Text>
        <Text style={type.caption}>Route chevrons point toward the destination, not your phone heading. They pause when location or progress is uncertain.</Text>
        <Text style={type.caption}>Foreground tracking only. Check crossings and mapped endpoint gaps. Walking time is an estimate.</Text>
        {state.route?.reasons.map((reason, index) => <Text key={`reason-${index}`} style={type.caption}>{reason}</Text>)}
        {state.route?.warnings.map((warning, index) => <Text key={`warning-${index}`} style={styles.caveat}>{warning}</Text>)}
        {state.route && <Text style={type.caption}>{state.route.confidence.level} data confidence · {state.route.verification_summary}</Text>}
      </>}
      {!!state.error && <><Text accessibilityLiveRegion="assertive" style={[type.body, styles.error]}>{state.error}</Text>
        <SecondaryButton label="Retry route" disabled={state.rerouting} onPress={onRetry}/>
        <Text style={type.caption}>Retries are limited to one every 20 seconds.</Text></>}
      {state.status === 'paused' && <PrimaryButton label="Resume navigation" onPress={onResume}/>}
    </ScrollView>}
  </View>;
}
const styles = StyleSheet.create({
  guidance: { flexGrow: 0, margin: theme.space.sm, borderRadius: theme.radius.lg, backgroundColor: theme.color.surface, ...theme.elevation.floating },
  guidanceTitle: { ...type.label, color: theme.color.accent },
  destination: { ...type.body, fontWeight: '600' },
  destinationText: { flex: 1 },
  destinationButton: { minHeight: theme.target, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: theme.space.xs },
  chevron: { ...type.title, color: theme.color.accent },
  warning: { backgroundColor: theme.color.safetySurface, borderRadius: theme.radius.sm, paddingHorizontal: theme.space.xs },
  warningToggle: { minHeight: theme.target, justifyContent: 'center' },
  warningTitle: { ...type.label, color: theme.color.safety },
  warningText: { ...type.caption, color: theme.color.warning, paddingBottom: theme.space.xs },
  metrics: { ...type.heading, color: theme.color.accent, fontVariant: ['tabular-nums'] },
  time: { ...type.body, color: theme.color.ink, fontWeight: '600' },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: theme.space.sm, rowGap: theme.space.xxs },
  summary: { gap: theme.space.xs, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm },
  metricsRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.xs, justifyContent: 'flex-end' },
  stats: { flex: 1, gap: theme.space.xxs },
  detailsToggle: { minHeight: theme.target, minWidth: theme.target, justifyContent: 'center', paddingHorizontal: theme.space.xxs, borderRadius: theme.radius.sm },
  detailsLabel: { ...type.label, color: theme.color.accent },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  action: { flexGrow: 1, flexBasis: 140 },
  track: { height: 4, backgroundColor: theme.color.raised, borderRadius: theme.radius.pill, overflow: 'hidden', marginHorizontal: theme.space.sm },
  fill: { height: '100%', backgroundColor: theme.color.accent, borderRadius: theme.radius.pill },
  panel: { paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs, gap: theme.space.xxs },
  details: { flexGrow: 0, flexShrink: 1 },
  detailContent: { paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs, gap: theme.space.xs },
  bottom: { flexShrink: 1, paddingBottom: theme.space.xs, backgroundColor: theme.color.surface, borderTopLeftRadius: theme.radius.sheet, borderTopRightRadius: theme.radius.sheet, ...theme.elevation.sheet },
  caveat: { ...type.caption, color: theme.color.warning }, error: { color: theme.color.error },
});

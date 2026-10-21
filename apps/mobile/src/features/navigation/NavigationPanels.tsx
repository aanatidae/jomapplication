import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import type { NavigationState } from './session';
import { profileLabels } from '../planner/usePlanner';

export function NavigationGuidance({ state, destination }: { state: NavigationState; destination: string }) {
  return <ScrollView style={styles.guidance} contentContainerStyle={styles.panel}>
    <Text accessibilityRole="header" style={type.title}>{state.status === 'arrived' ? 'You have arrived' : state.rerouting ? 'Recalculating route' : state.status === 'starting' ? 'Preparing navigation' : state.status === 'paused' ? 'Navigation paused' : 'Follow the route'}</Text>
    <Text style={type.body}>{destination}</Text>
    <Text style={type.caption}>{state.route && profileLabels[state.route.profile]} · Route-following guidance. Turn-by-turn instructions unavailable.</Text>
    {!!state.warning && <Text accessibilityLiveRegion="polite" style={type.body}>{state.warning}</Text>}
  </ScrollView>;
}
export function NavigationProgress({ state, onStop, onResume, onRetry }: {
  state: NavigationState; onStop: () => void; onResume: () => void; onRetry: () => void;
}) {
  const remaining = state.remainingM;
  const minutes = state.remainingS === undefined ? undefined : Math.ceil(state.remainingS / 60);
  const arrival = state.remainingS === undefined || !state.position ? undefined : new Date(state.position.timestamp + state.remainingS * 1000).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return <View style={styles.bottom}>
    <ScrollView contentContainerStyle={styles.panel}>
      <Text accessibilityRole="header" style={type.heading}>{state.status === 'arrived' ? 'Walk complete' : remaining === undefined ? 'Waiting for route progress' : `${Math.round(remaining)} m · ${minutes} min left`}</Text>
      {arrival && state.status !== 'arrived' && <Text style={type.body}>Estimated arrival {arrival}</Text>}
      <Text style={type.caption}>{state.position?.accuracy != null ? `Location accuracy ±${Math.round(state.position.accuracy)} m. ` : ''}Foreground tracking only. Check crossings and mapped endpoint gaps.</Text>
      {!!state.error && <><Text accessibilityLiveRegion="assertive" style={[type.body, styles.error]}>{state.error}</Text>
        <SecondaryButton label="Retry route" disabled={state.rerouting} onPress={onRetry}/>
        <Text style={type.caption}>Retries are limited to one every 20 seconds.</Text></>}
      {state.status === 'paused' && <PrimaryButton label="Resume navigation" onPress={onResume}/>}
    </ScrollView>
    <View style={styles.stop}><PrimaryButton label={state.status === 'arrived' ? 'Return to Planner' : 'Stop Navigation'} onPress={onStop}/></View>
  </View>;
}
const styles = StyleSheet.create({
  guidance: { flexGrow: 0, margin: theme.space.sm, borderRadius: theme.radius.lg, backgroundColor: theme.color.surface, ...theme.elevation.sheet },
  panel: { padding: theme.space.md, gap: theme.space.xs },
  bottom: { flexShrink: 1, backgroundColor: theme.color.surface, borderTopLeftRadius: theme.radius.sheet, borderTopRightRadius: theme.radius.sheet, ...theme.elevation.sheet },
  stop: { padding: theme.space.sm }, error: { color: theme.color.error },
});

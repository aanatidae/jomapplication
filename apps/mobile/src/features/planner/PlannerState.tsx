import { StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import type { DemoState } from './mockRoutes';

const copy = {
  loading: ['Loading routes', 'Preparing the local demo route options.'],
  empty: ['No route available', 'Try a different origin or destination in this demo.'],
  mapUnavailable: ['Map unavailable', 'You can still compare route details below.'],
  permissionDenied: ['Location permission denied', 'Choose an origin manually. This demo does not request your location.'],
  dataUnavailable: ['Route data unavailable', 'There is no route information to compare right now.'],
  error: ['Something went wrong', 'Your trip is still here. Try loading the demo again.'],
} as const;
export function PlannerState({ state, onRetry }: { state: Exclude<DemoState, 'ready' | 'unknown'>; onRetry: () => void }) {
  const [title, description] = copy[state];
  return <View accessibilityLiveRegion="polite" style={styles.state}>
    <Text accessibilityRole="header" style={type.title}>{title}</Text>
    <Text style={type.body}>{description}</Text>
    {state === 'loading' && <View accessibilityRole="progressbar" accessibilityLabel="Loading demo routes" accessibilityState={{ busy: true }} style={styles.progress} />}
    <SecondaryButton label={state === 'loading' ? 'Show demo routes' : state === 'permissionDenied' ? 'Use manual origin' : 'Retry demo'} onPress={onRetry} />
  </View>;
}
const styles = StyleSheet.create({
  state: { padding: theme.space.lg, gap: theme.space.sm, backgroundColor: theme.color.surface, borderRadius: theme.radius.lg },
  progress: { height: theme.space.xs, borderRadius: theme.radius.pill, backgroundColor: theme.color.accent },
});

import { StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import type { RouteProfile, RoutingErrorKind } from '../../services/routingApi';
import { theme, type } from '../../theme/tokens';

export function ApiPlannerState({ status, error, profile, onRetry }: {
  status: 'loading' | 'empty' | 'error'; error?: RoutingErrorKind; profile: RouteProfile; onRetry: () => void;
}) {
  const title = status === 'loading' ? 'Loading routes' : status === 'empty' ? 'No route available' : "Couldn't load routes.";
  const message = status === 'loading' ? 'Calculating routes for your selected trip and priority.' :
    error === 'same_point' ? 'Choose different locations. These points snap to the same mapped pedestrian node.' :
    status === 'empty' ? (profile === 'step_free' ? 'No verified step-free route is available for this trip.' : 'Try a different pilot origin or destination.') :
    error === 'timeout' ? 'The routing service took too long to respond.' :
    error === 'configuration' ? 'The routing service is not configured yet. Ask the demo operator to start the service.' :
    error === 'outside_network' ? 'This place is outside the current pilot network. Choose another pilot place.' :
    "We couldn't calculate this route. Check your connection and try again.";
  return <View accessibilityLiveRegion="polite" style={styles.state}>
    <Text accessibilityRole="header" style={type.title}>{title}</Text><Text style={type.body}>{message}</Text>
    {status === 'loading' ? <View accessible accessibilityRole="progressbar" accessibilityLabel="Loading routes" accessibilityState={{ busy: true }} style={styles.progress} /> :
      <SecondaryButton label="Retry" onPress={onRetry} />}
  </View>;
}
const styles = StyleSheet.create({
  state: { padding: theme.space.lg, gap: theme.space.sm, backgroundColor: theme.color.surface, borderRadius: theme.radius.lg },
  progress: { height: theme.space.xs, borderRadius: theme.radius.pill, backgroundColor: theme.color.accent },
});

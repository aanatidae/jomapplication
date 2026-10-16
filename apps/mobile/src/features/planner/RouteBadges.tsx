import { StyleSheet, Text, View } from 'react-native';
import { theme, type } from '../../theme/tokens';
import type { MockRoute } from './mockRoutes';

export function RouteReasonBadge({ label }: { label: string }) {
  return <View style={styles.reason}><Text style={type.caption}>{label}</Text></View>;
}
export function ConfidenceBadge({ label, quality }: { label: string; quality: MockRoute['quality'] }) {
  const prefix = quality === 'data' ? 'Data' : quality === 'verified' ? 'Checked' : quality === 'community' ? 'Source' : 'Unknown';
  return <Text style={[type.caption, styles.confidence, quality !== 'verified' && styles.unknown]}>{prefix}: {label}</Text>;
}
const styles = StyleSheet.create({
  reason: { backgroundColor: theme.color.raised, paddingHorizontal: theme.space.xs, paddingVertical: theme.space.xxs, borderRadius: theme.radius.sm, maxWidth: '100%' },
  confidence: { color: theme.color.verified, flexShrink: 1 }, unknown: { color: theme.color.warning },
});

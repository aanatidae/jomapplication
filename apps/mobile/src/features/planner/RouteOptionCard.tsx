import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme, type } from '../../theme/tokens';
import { ConfidenceBadge, RouteReasonBadge } from './RouteBadges';
import type { MockRoute } from './mockRoutes';

export function RouteOptionCard({ route, selected, onPress }: { route: MockRoute; selected: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const detour = route.minutes === 8 ? 'Fastest option' : `+${route.minutes - 8} min vs fastest`;
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected, checked: selected }}
    accessibilityLabel={`${route.mode}, ${route.minutes} minutes, ${route.distance} metres, ${detour}. ${route.reasons.join('. ')}. ${route.confidence}. ${route.freshness}`}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={onPress}
    style={({ pressed }) => [styles.card, selected && styles.selected, focused && styles.focus, pressed && styles.pressed]}>
    <View style={styles.top}><Text style={[type.title, styles.grow]}>{route.mode}</Text><Text style={type.label}>{selected ? 'Selected' : 'Select route'}</Text></View>
    <View style={styles.metrics}><Text style={type.heading}>{route.minutes} min</Text><Text style={type.body}>{route.distance} m</Text><Text style={type.caption}>{detour}</Text></View>
    <View style={styles.reasons}>{route.reasons.map((reason, i) => <RouteReasonBadge key={`${i}-${reason}`} label={reason} />)}</View>
    <ConfidenceBadge label={route.confidence} quality={route.quality} />
    <Text style={type.caption}>{route.freshness}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { padding: theme.space.md, gap: theme.space.xs, borderRadius: theme.radius.lg, borderWidth: 2, borderColor: theme.color.outline, backgroundColor: theme.color.surface, minHeight: theme.target },
  selected: { borderColor: theme.color.accent, backgroundColor: theme.color.selected },
  top: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, alignItems: 'center', justifyContent: 'space-between' },
  grow: { flexShrink: 1 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: theme.space.sm },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }, focus: { borderColor: theme.color.focus }, pressed: { opacity: 0.7 },
});

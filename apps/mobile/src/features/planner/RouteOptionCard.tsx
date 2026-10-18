import { MotionPressable } from '../motion/Motion';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, type } from '../../theme/tokens';
import { ConfidenceBadge, RouteReasonBadge } from './RouteBadges';
import type { MockRoute } from './mockRoutes';
import { AccessibilityStatus, FreshnessLabel, RouteWarningBanner, useQualityClock } from '../quality/components';
import { freshnessDays, isStale } from '../quality/policy';
import { selectionFeedback } from '../motion/haptics';

export function RouteOptionCard({ route, selected, onPress }: { route: MockRoute; selected: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  const now = useQualityClock();
  const detour = route.detour ?? '';
  return <MotionPressable accessibilityRole="radio" accessibilityState={{ selected, checked: selected }}
    accessibilityLabel={`${route.mode}, ${route.minutes} minutes, ${route.distance} metres. ${detour} ${route.reasons.join('. ')}. ${route.confidence}. ${route.freshness}. ${route.dataQuality?.accessibility_incomplete ? 'Accessibility information incomplete. ' : ''}${(route.warnings ?? []).join('. ')}`}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onPress={() => { if (!selected) selectionFeedback(); onPress(); }}
    style={({ pressed }) => [styles.card, selected && styles.selected, focused && styles.focus, pressed && styles.pressed]}>
    <View style={styles.top}><Text style={[type.title, styles.grow]}>{route.mode}</Text><Text style={type.label}>{selected ? 'Selected' : 'Select route'}</Text></View>
    <View style={styles.metrics}><Text style={type.heading}>{route.minutes} min</Text><Text style={type.body}>{route.distance} m</Text><Text style={type.caption}>{detour}</Text></View>
    <View style={styles.reasons}>{route.reasons.map((reason, i) => <RouteReasonBadge key={`${i}-${reason}`} label={reason} />)}</View>
    {route.warnings?.map((warning, i) => <Text key={i} style={[type.caption, { color: theme.color.warning }]}>{warning}</Text>)}
    <ConfidenceBadge label={route.confidence} quality={route.quality} />
    <Text style={type.caption}>{route.freshness}</Text>
    {route.quality === 'data' && <>
      <FreshnessLabel kind="Last updated" date={route.dataQuality?.oldest_updated_at ?? undefined} now={now}/>
      <AccessibilityStatus incomplete={route.dataQuality?.accessibility_incomplete}/>
      {(route.dataQuality?.stale || isStale(route.dataQuality?.oldest_updated_at ?? undefined, freshnessDays.infrastructure, now)) && <RouteWarningBanner text="Recorded information needs updating · check current conditions"/>}
    </>}
  </MotionPressable>;
}
const styles = StyleSheet.create({
  card: { padding: theme.space.md, gap: theme.space.xs, borderRadius: theme.radius.lg, borderWidth: 2, borderColor: theme.color.outline, backgroundColor: theme.color.surface, minHeight: theme.target },
  selected: { borderColor: theme.color.accent, backgroundColor: theme.color.selected },
  top: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, alignItems: 'center', justifyContent: 'space-between' },
  grow: { flexShrink: 1 }, metrics: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: theme.space.sm },
  reasons: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }, focus: { borderColor: theme.color.focus }, pressed: { opacity: 0.7 },
});

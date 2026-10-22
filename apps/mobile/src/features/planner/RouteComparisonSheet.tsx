import { StyleSheet, Text, View } from 'react-native';
import { MotionPressable } from '../motion/Motion';
import { theme, type } from '../../theme/tokens';
import { RouteOptionCard } from './RouteOptionCard';
import { RouteProfileChip } from './RouteProfileChip';
import type { MockRoute, RouteProfile } from './mockRoutes';
import { DataSourceInfo } from '../quality/DataSourceInfo';
import { useState } from 'react';

export function RouteComparisonSheet({ routes, selected, onSelect, expanded, onToggle, hideProfiles = false }: {
  routes: readonly MockRoute[]; selected: RouteProfile; onSelect: (id: RouteProfile) => void; expanded: boolean; onToggle: () => void; hideProfiles?: boolean;
}) {
  const selectedRoute = routes.find(r => r.id === selected);
  const [focused, setFocused] = useState(false);
  const ordered = selectedRoute ? [selectedRoute, ...routes.filter(r => r.id !== selected)] : routes;
  return <View style={styles.sheet}>
    <View style={styles.heading}>
      <View style={styles.headingText}>
        <Text accessibilityRole="header" style={expanded ? type.title : type.label}>{expanded ? 'Choose your walk' : selectedRoute?.mode ?? 'Your walk'}</Text>
        {!expanded && <Text style={styles.notice}>Unverified route data</Text>}
      </View>
      <MotionPressable accessibilityRole="button" accessibilityLabel={expanded ? 'Collapse comparison' : routes.length === 1 ? 'Walking route details' : `Compare ${routes.length} routes`}
        accessibilityState={{ expanded }} onPress={onToggle} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={({ pressed }) => [styles.toggle, focused && styles.focused, pressed && styles.pressed]}>
        <Text style={styles.toggleLabel}>{expanded ? 'Less ↓' : 'Details ↑'}</Text>
      </MotionPressable>
    </View>
    {!hideProfiles && <View accessibilityRole="radiogroup" accessibilityLabel="Route priority" style={styles.profiles}>
      {routes.map(route => <RouteProfileChip key={route.id} route={route} selected={selected === route.id} onPress={() => onSelect(route.id)} />)}
    </View>}
    <View accessibilityRole="radiogroup" accessibilityLabel="Route options" style={styles.cards}>
      {(expanded ? ordered : ordered.slice(0, 1)).map(route => <RouteOptionCard key={route.id} route={route} compact={!expanded} selected={selected === route.id} onPress={() => onSelect(route.id)} />)}
    </View>
    {expanded && <>
      {selectedRoute && <DataSourceInfo key={selectedRoute.id} route={selectedRoute}/>}
      <Text style={type.caption}>{selectedRoute?.coordinateSystem === 'WGS84' ? 'OpenStreetMap data; not field verified.' : 'Demo data only.'} Lighting and public activity are indicators, not guarantees. Conditions may change.</Text>
    </>}
  </View>;
}
const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.color.surface, paddingHorizontal: theme.space.md, paddingBottom: theme.space.sm, gap: theme.space.xs },
  heading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: theme.space.xxs },
  headingText: { flex: 1 },
  toggle: { minHeight: theme.target, minWidth: theme.target, paddingHorizontal: theme.space.xs, justifyContent: 'center', borderRadius: theme.radius.sm, borderWidth: 2, borderColor: 'transparent' },
  focused: { borderColor: theme.color.focus },
  toggleLabel: { ...type.label, color: theme.color.accent }, pressed: { backgroundColor: theme.color.selected },
  notice: { ...type.caption },
  profiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }, cards: { gap: theme.space.sm },
});

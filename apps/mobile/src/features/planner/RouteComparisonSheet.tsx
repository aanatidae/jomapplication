import { StyleSheet, Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import { RouteOptionCard } from './RouteOptionCard';
import { RouteProfileChip } from './RouteProfileChip';
import type { MockRoute, RouteProfile } from './mockRoutes';
import { DataSourceInfo } from '../quality/DataSourceInfo';

export function RouteComparisonSheet({ routes, selected, onSelect, expanded, onToggle, hideProfiles = false }: {
  routes: readonly MockRoute[]; selected: RouteProfile; onSelect: (id: RouteProfile) => void; expanded: boolean; onToggle: () => void; hideProfiles?: boolean;
}) {
  const selectedRoute = routes.find(r => r.id === selected);
  const ordered = selectedRoute ? [selectedRoute, ...routes.filter(r => r.id !== selected)] : routes;
  return <View style={styles.sheet}>
    <Text accessibilityRole="header" style={type.heading}>Your walk, your priority.</Text>
    <Text style={type.body}>Same origin. Same destination. Different best route.</Text>
    {!hideProfiles && <View accessibilityRole="radiogroup" accessibilityLabel="Route priority" style={styles.profiles}>
      {routes.map(route => <RouteProfileChip key={route.id} route={route} selected={selected === route.id} onPress={() => onSelect(route.id)} />)}
    </View>}
    <SecondaryButton label={expanded ? 'Collapse comparison' : `Compare ${routes.length} route${routes.length === 1 ? "" : "s"}`} accessibilityState={{ expanded }} onPress={onToggle} />
    <View accessibilityRole="radiogroup" accessibilityLabel="Route options" style={styles.cards}>
      {(expanded ? ordered : ordered.slice(0, 1)).map(route => <RouteOptionCard key={route.id} route={route} selected={selected === route.id} onPress={() => onSelect(route.id)} />)}
    </View>
    {selectedRoute && <DataSourceInfo key={selectedRoute.id} route={selectedRoute}/>}
    <Text style={type.caption}>Demo data only. Lighting and public activity are indicators, not guarantees. Conditions may change.</Text>
  </View>;
}
const styles = StyleSheet.create({
  sheet: { backgroundColor: theme.color.surface, borderTopLeftRadius: theme.radius.sheet, borderTopRightRadius: theme.radius.sheet, padding: theme.space.md, gap: theme.space.sm, ...theme.elevation.sheet },
  profiles: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs }, cards: { gap: theme.space.sm },
});

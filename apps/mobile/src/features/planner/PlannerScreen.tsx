import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { theme, type } from '../../theme/tokens';
import { MapCanvas } from './MapCanvas';
import { RouteComparisonSheet } from './RouteComparisonSheet';
import { RouteProfileChip } from './RouteProfileChip';
import { TripSearchBar } from './TripSearchBar';
import { pilotPlaces, profileLabels, usePlanner } from './usePlanner';
import { ApiPlannerState } from './ApiPlannerState';
import { toDisplayRoutes } from './routePresentation';

export function PlannerScreen() {
  const planner = usePlanner();
  const [expanded, setExpanded] = useState(true);
  const { fontScale } = useWindowDimensions();
  const routes = toDisplayRoutes(planner.routeOptions);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Text style={type.display}>Jom!</Text><View>
      <Text accessibilityRole="header" style={type.label}>Planner</Text><Text style={type.caption}>Walking · Simulated pilot</Text>
    </View></View>
    <TripSearchBar origin={planner.origin} destination={planner.destination} availablePlaces={Object.keys(pilotPlaces)}
      onChange={(field, value) => field === 'origin' ? planner.setOrigin(value) : planner.setDestination(value)} />
    <MapCanvas selected={planner.selectedRoute?.id ?? ''} origin={planner.origin} destination={planner.destination}
      routesVisible={planner.status === 'ready'} routeOptions={routes} compact={fontScale > 1.5} showOptionLabels />
    <View style={styles.priority} accessibilityRole="radiogroup" accessibilityLabel="Route priority">
      {(Object.keys(profileLabels) as (keyof typeof profileLabels)[]).map(profile =>
        <RouteProfileChip key={profile} route={{ mode: profileLabels[profile] }} selected={planner.selectedProfile === profile}
          onPress={() => planner.setProfile(profile)} />)}
    </View>
    {planner.status === 'ready' ? <RouteComparisonSheet routes={routes} selected={planner.selectedRoute?.id ?? ''}
      onSelect={planner.selectRoute} expanded={expanded} onToggle={() => setExpanded(v => !v)} hideProfiles /> :
      <ApiPlannerState status={planner.status} error={planner.error?.kind} profile={planner.selectedProfile} onRetry={planner.retry} />}
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.background },
  content: { width: '100%', maxWidth: theme.layout.contentMax, alignSelf: 'center', paddingBottom: theme.space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space.md, padding: theme.space.md, backgroundColor: theme.color.surface, alignItems: 'center' },
  priority: { flexDirection: 'row', flexWrap: 'wrap', padding: theme.space.md, gap: theme.space.xs },
});

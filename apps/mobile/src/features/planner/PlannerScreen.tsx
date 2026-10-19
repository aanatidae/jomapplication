import { setReportRoute } from '../barriers/model';
import { router } from 'expo-router';
import { SecondaryButton } from '../../components/Buttons';
import { setSharePath } from '../community/data';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { theme, type } from '../../theme/tokens';
import { MapCanvas } from './MapCanvas';
import { GeographicMap } from './GeographicMap';
import { geographicPoint, pointLabel, type GeographicPoint } from './geographic';
import { getCurrentOrigin, LocationUnavailable } from '../../services/currentLocation';
import { RouteComparisonSheet } from './RouteComparisonSheet';
import { RouteProfileChip } from './RouteProfileChip';
import { TripSearchBar } from './TripSearchBar';
import { pilotPlaces, profileLabels, usePlanner } from './usePlanner';
import { ApiPlannerState } from './ApiPlannerState';
import { toDisplayRoutes } from './routePresentation';

export function PlannerScreen() {
  const planner = usePlanner();
  const [expanded, setExpanded] = useState(true);
  const [selecting, setSelecting] = useState<'origin' | 'destination' | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeographicPoint>();
  const [locationStatus, setLocationStatus] = useState('');
  const [locating, setLocating] = useState(false);
  async function locate() {
    if (locating) return;
    setLocating(true); setLocationStatus('Finding your location…');
    try { const point = await getCurrentOrigin(); setCurrentLocation(point); planner.setOrigin(pointLabel(point)); setLocationStatus('Current location selected. Check the mapped route start.'); }
    catch (error) { setLocationStatus(error instanceof LocationUnavailable && error.reason === 'denied' ? 'Location permission denied. Choose a start place or select a start on the map.' : 'Current location unavailable. Choose a start place or select a start on the map.'); }
    finally { setLocating(false); }
  }
  const { fontScale } = useWindowDimensions();
  const routes = useMemo(() => toDisplayRoutes(planner.routeOptions), [planner.routeOptions]);
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Text style={type.display}>Jom!</Text><View style={styles.headerEnd}>
      <Text accessibilityRole="header" style={type.label}>Planner</Text><Text style={type.caption}>Walking · Brickfields pilot</Text>
    </View></View>
    <TripSearchBar geographic origin={planner.origin} destination={planner.destination} availablePlaces={Object.keys(pilotPlaces)}
      onChange={(field, value) => field === 'origin' ? planner.setOrigin(value) : planner.setDestination(value)} />
    <View style={styles.priority} accessibilityRole="radiogroup" accessibilityLabel="Route priority">
      {(Object.keys(profileLabels) as (keyof typeof profileLabels)[]).map(profile =>
        <RouteProfileChip key={profile} route={{ mode: profileLabels[profile] }} selected={planner.selectedProfile === profile}
          onPress={() => planner.setProfile(profile)} />)}
    </View>
    <View style={styles.mapActions}>
      <SecondaryButton label={locating ? 'Finding location…' : 'Use current location'} disabled={locating} onPress={() => void locate()} />
      <SecondaryButton label="Set start on map" onPress={() => setSelecting('origin')} />
      <SecondaryButton label="Set destination on map" onPress={() => setSelecting('destination')} />
      {selecting && <SecondaryButton label="Cancel map selection" onPress={() => setSelecting(null)} />}
      {!!locationStatus && <Text accessibilityLiveRegion="polite" style={type.caption}>{locationStatus}</Text>}
    </View>
    {routes[0]?.coordinateSystem === 'schematic_demo' ? <MapCanvas selected={planner.selectedRoute?.id ?? ''} origin={planner.origin} destination={planner.destination} routesVisible={planner.status === 'ready'} routeOptions={routes} compact={fontScale > 1.5} showOptionLabels /> :
    <GeographicMap selected={planner.selectedRoute?.id ?? ''} origin={planner.origin} destination={planner.destination}
      originPoint={geographicPoint(planner.origin)} destinationPoint={geographicPoint(planner.destination)} currentLocation={currentLocation}
      onPick={point => { if (!selecting) return; (selecting === 'origin' ? planner.setOrigin : planner.setDestination)(pointLabel(point)); setSelecting(null); }}
      selectionLabel={selecting ? `Tap the map to choose your ${selecting === 'origin' ? 'start' : 'destination'}.` : undefined}
      routesVisible={planner.status === 'ready'} routeOptions={routes} compact={fontScale > 1.5} />}
    {planner.selectedRoute && <View style={styles.priority}><SecondaryButton label="Share selected route" onPress={() => {
      const selected = routes.find(r => r.id === planner.selectedRoute?.id);
      if (!selected) return;
      setSharePath({ id: selected.id, label: selected.mode, origin: planner.origin, destination: planner.destination, geometry: selected.geometry, distanceM: selected.distance, durationMinutes: selected.minutes, coordinateSystem: selected.coordinateSystem ?? 'schematic_demo' });
      router.push('/share-route');
    }}/></View>}
    <View style={styles.priority}><SecondaryButton label="Report Barrier" onPress={() => {
      const selected = routes.find(r => r.id === planner.selectedRoute?.id);
      setReportRoute(selected ? { id: selected.id, label: selected.mode, origin: planner.origin, destination: planner.destination, geometry: selected.geometry, distanceM: selected.distance, durationMinutes: selected.minutes, coordinateSystem: selected.coordinateSystem ?? 'schematic_demo' } : null);
      router.push('/report-barrier');
    }}/><SecondaryButton label="Reports" onPress={() => router.push('/barrier-reports')}/></View>
    {planner.status === 'empty' && <Text style={[type.caption, { padding: theme.space.md }]}>Your saved preferences may limit available routes. You can adjust them in Profile.</Text>}
    {planner.status === 'ready' ? <RouteComparisonSheet routes={routes} selected={planner.selectedRoute?.id ?? ''}
      onSelect={planner.selectRoute} expanded={expanded} onToggle={() => setExpanded(v => !v)} hideProfiles /> :
      <ApiPlannerState status={planner.status} error={planner.error?.kind} profile={planner.selectedProfile} onRetry={planner.retry} />}
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.background },
  content: { width: '100%', maxWidth: theme.layout.contentMax, alignSelf: 'center', paddingBottom: theme.space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space.md, padding: theme.space.md, backgroundColor: theme.color.surface, alignItems: 'center' },
  headerEnd: { flexShrink: 1 },
  priority: { flexDirection: 'row', flexWrap: 'wrap', padding: theme.space.md, gap: theme.space.xs },
  mapActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.space.md, paddingBottom: theme.space.xs, gap: theme.space.xs },
});

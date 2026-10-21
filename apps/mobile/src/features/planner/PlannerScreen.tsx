import { BarrierModal, type DemoReport } from '../barriers/BarrierModal';
import type { SharedPath } from '../community/types';
import { router } from 'expo-router';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { setSharePath } from '../community/data';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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
import { useNavigation } from '../navigation/useNavigation';
import { remainingGeometry } from '../navigation/geometry';
import { NavigationGuidance, NavigationProgress } from '../navigation/NavigationPanels';
import { usePreferences } from '../preferences/PreferencesProvider';
import { toRoutePreferences } from '../preferences/model';
import { useMotionReduced } from '../motion/Motion';
import * as Location from 'expo-location';

export function PlannerScreen() {
  const [demoClosure, setDemoClosure] = useState(false);
  const [demoReport, setDemoReport] = useState<DemoReport>();
  const [reporting, setReporting] = useState(false);
  const { state: navigation, session } = useNavigation();
  const navigating = navigation.status !== 'idle';
  const planner = usePlanner(demoClosure, !navigating);
  const { preferences } = usePreferences();
  const reducedMotion = useMotionReduced();
  const locatingRef = useRef(false);
  const alive = useRef(true);
  const manuallySelectedOrigin = useRef(false);
  const [currentLocation, setCurrentLocation] = useState<GeographicPoint>();
  const [topInset, setTopInset] = useState(150);
  const [bottomInset, setBottomInset] = useState(350);
  const mapInsets = useMemo(() => ({ top: topInset, bottom: bottomInset }), [topInset, bottomInset]);
  useEffect(() => {
    alive.current = true;
    // An existing grant permits showing location; opening Planner never prompts.
    void Location.getForegroundPermissionsAsync().then(async permission => {
      if (!permission.granted) return;
      const point = await getCurrentOrigin();
      if (alive.current && !manuallySelectedOrigin.current) { setCurrentLocation(point); session.recenter(); planner.setOrigin(pointLabel(point)); }
    }).catch(() => {});
    return () => { alive.current = false; };
    // Location initialization happens once, rather than resetting manual trip edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [expanded, setExpanded] = useState(false);
  const [selecting, setSelecting] = useState<'origin' | 'destination' | null>(null);

  const [locationStatus, setLocationStatus] = useState('');
  const [locating, setLocating] = useState(false);
  async function locate() {
    if (locatingRef.current) return;
    locatingRef.current = true; manuallySelectedOrigin.current = true;
    setLocating(true); setLocationStatus('Finding your location…');
    try { const point = await getCurrentOrigin(); if (!alive.current) return; setCurrentLocation(point); session.recenter(); planner.setOrigin(pointLabel(point)); setLocationStatus('Current location selected. Check the mapped route start.'); }
    catch (error) { setLocationStatus(error instanceof LocationUnavailable && error.reason === 'denied' ? 'Location permission denied. Choose a start place or select a start on the map.' : 'Current location unavailable. Choose a start place or select a start on the map.'); }
    finally { locatingRef.current = false; if (alive.current) setLocating(false); }
  }
  const { fontScale, height } = useWindowDimensions();
  const routes = useMemo(() => toDisplayRoutes(planner.routeOptions), [planner.routeOptions]);
  const displayedRoutes = useMemo(() => navigating ? navigation.route && !navigation.routeInvalidated ? toDisplayRoutes([navigation.route]) : [] : routes, [navigating, navigation.route, navigation.routeInvalidated, routes]);
  const selectedId = navigating ? navigation.route?.id ?? '' : planner.selectedRoute?.id ?? '';
  const remainingPath = useMemo(() => navigating && navigation.route && !navigation.routeInvalidated ? remainingGeometry(navigation.route.geometry.coordinates, navigation.progress) : undefined, [navigating, navigation.route, navigation.routeInvalidated, navigation.progress]);
  const selectedForReport = displayedRoutes.find(r => r.id === selectedId);
  const reportRoute: SharedPath | null = selectedForReport ? { id: selectedForReport.id, label: selectedForReport.mode, origin: planner.origin, destination: planner.destination, geometry: selectedForReport.geometry, distanceM: selectedForReport.distance, durationMinutes: selectedForReport.minutes, coordinateSystem: selectedForReport.coordinateSystem ?? 'schematic_demo' } : null;
  async function changeClosure(active: boolean) {
    setReporting(false); setDemoClosure(active);
    if (!active) setDemoReport(undefined);
    if (!await session.setDemoClosure(active)) setLocationStatus('Reliable current GPS unavailable. Navigation returned to Planner preview; no movement was simulated.');
  }
  const demoSeconds = navigating ? navigation.remainingS : planner.selectedRoute?.estimated_time_s;
  const demoMeters = navigating ? navigation.remainingM : planner.selectedRoute?.distance_m;
  const demoNotice = demoClosure ? <View style={styles.demoNotice}>
    <Text accessibilityLiveRegion="polite" style={type.caption}>{(navigating ? navigation.rerouting : planner.status === 'loading') ? 'Demo blockage active — calculating alternative…' :
      (navigating ? navigation.routeInvalidated : planner.status !== 'ready') ? 'Demo blockage active — no suitable alternative available. Retry or clear the simulation.' : 'Demo blockage active — alternative route calculated'}</Text>
    {demoSeconds !== undefined && demoMeters !== undefined && <Text style={type.caption}>{Math.round(demoMeters)} m · {Math.floor(Math.round(demoSeconds) / 60)} min {Math.round(demoSeconds) % 60} sec walking · no waiting</Text>}
    <Text style={type.caption}>Unmarked crossings · not field verified.</Text>
    <SecondaryButton label="Clear demo blockage" disabled={navigation.status === 'starting'} onPress={() => void changeClosure(false)}/>
  </View> : demoReport ? <Text accessibilityLiveRegion="polite" style={styles.message}>Demo report pending · unverified. Open Report Barrier to activate the simulation.</Text> : null;
  const destinationPoint = geographicPoint(planner.destination);
  function stopNavigation() {
    if (navigation.position) setCurrentLocation(navigation.position);
    session.stop();
  }
  const priorityStrip = <ScrollView horizontal style={{ flexGrow: 0, flexShrink: 0, height: theme.target + theme.space.md + type.label.lineHeight * Math.max(0, fontScale - 1) }} contentContainerStyle={styles.priority} accessibilityRole="radiogroup" accessibilityLabel="Route priority" showsHorizontalScrollIndicator={false}>
          {(Object.keys(profileLabels) as (keyof typeof profileLabels)[]).map(profile =>
            <RouteProfileChip key={profile} route={{ mode: profileLabels[profile] }} selected={planner.selectedProfile === profile} onPress={() => planner.setProfile(profile)} />)}
        </ScrollView>;
  return <View style={styles.screen}>
    <View style={StyleSheet.absoluteFill}>
      {routes[0]?.coordinateSystem === 'schematic_demo' && !navigating ? <MapCanvas selected={selectedId} origin={planner.origin} destination={planner.destination} routesVisible={planner.status === 'ready'} routeOptions={routes} compact={fontScale > 1.5} showOptionLabels /> :
        <GeographicMap fill selected={selectedId} origin={planner.origin} destination={planner.destination}
          originPoint={geographicPoint(planner.origin)} destinationPoint={destinationPoint}
          currentLocation={navigating ? navigation.position : currentLocation} accuracy={navigation.position?.accuracy}
          heading={navigation.heading} navigating={navigating} following={navigating || currentLocation ? navigation.following : undefined}
          mapInsets={mapInsets} reducedMotion={reducedMotion} remainingPath={remainingPath} onExplore={session.explore}
          demoBlockage={demoClosure ? demoReport?.crossing : undefined}
          onPick={point => { if (!selecting || navigating) return; manuallySelectedOrigin.current = true; (selecting === 'origin' ? planner.setOrigin : planner.setDestination)(pointLabel(point)); setSelecting(null); }}
          routesVisible={navigating || planner.status === 'ready'} routeOptions={displayedRoutes} />}
    </View>
    {navigating ? <View onLayout={event => setTopInset(event.nativeEvent.layout.height)} style={styles.guidance}><NavigationGuidance state={navigation} destination={planner.destination}/></View> : <ScrollView onLayout={event => setTopInset(event.nativeEvent.layout.height + theme.space.md)} style={styles.search} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Text style={styles.brand}>Jom!</Text><Text style={styles.eyebrow}>BRICKFIELDS · ON FOOT</Text></View>
      <TripSearchBar compact geographic origin={planner.origin} destination={planner.destination} availablePlaces={Object.keys(pilotPlaces)}
        onChange={(field, value) => { manuallySelectedOrigin.current = true; (field === 'origin' ? planner.setOrigin : planner.setDestination)(value); }} />
    </ScrollView>}
    <View pointerEvents="box-none" style={styles.mapSpace}>
      {selecting && <View style={styles.selection}><Text style={type.body}>Tap the map to choose your {selecting === 'origin' ? 'start' : 'destination'}.</Text><SecondaryButton label="Cancel map selection" onPress={() => setSelecting(null)}/></View>}
      <View style={styles.controls}>
        <Text allowFontScaling={false} accessibilityRole="link" onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')} style={styles.attribution}>Leaflet · © OpenStreetMap contributors</Text>
        {navigating ? <SecondaryButton accessibilityLabel={navigation.following ? 'Following your location' : 'Recenter'} label={navigation.following ? 'Following' : 'Recenter'} onPress={session.recenter}/> :
          <SecondaryButton accessibilityLabel={locating ? 'Finding location…' : 'Use current location'} label={locating ? 'Locating…' : 'Locate me'} disabled={locating} onPress={() => void locate()} />}
      </View>
    </View>
    {navigating ? <View onLayout={event => setBottomInset(event.nativeEvent.layout.height + 80)} style={styles.navigationBottom}><NavigationProgress state={navigation} onStop={stopNavigation} onResume={() => void session.resume()} onRetry={() => void session.reroute()} onReport={() => setReporting(true)} notice={demoNotice}/></View> :
      <View onLayout={event => setBottomInset(event.nativeEvent.layout.height + 80)} style={[styles.sheet, { maxHeight: expanded ? '55%' : height < 700 ? '50%' : '42%' }]}>
        <View accessible={false} style={styles.handle} />
        {fontScale <= 1.5 && priorityStrip}
        <ScrollView keyboardShouldPersistTaps="handled" style={styles.comparison}>
          {demoNotice}
          {fontScale > 1.5 && priorityStrip}
          {!!locationStatus && <Text accessibilityLiveRegion="polite" style={styles.message}>{locationStatus}</Text>}
          {!!navigation.error && <Text accessibilityLiveRegion="assertive" style={styles.message}>{navigation.error}</Text>}
          {planner.status === 'ready' ? <RouteComparisonSheet routes={routes} selected={planner.selectedRoute?.id ?? ''}
            onSelect={planner.selectRoute} expanded={expanded} onToggle={() => setExpanded(v => !v)} hideProfiles /> :
            <ApiPlannerState status={planner.status} error={planner.error?.kind} profile={planner.selectedProfile} onRetry={planner.retry} />}
          {(expanded || planner.status !== 'ready') && <>
          <View style={styles.mapActions}>
            <SecondaryButton label="Set start on map" onPress={() => setSelecting('origin')} />
            <SecondaryButton label="Set destination on map" onPress={() => setSelecting('destination')} />
          </View>
    {planner.selectedRoute && <View style={styles.priority}><SecondaryButton label="Share selected route" onPress={() => {
      const selected = routes.find(r => r.id === planner.selectedRoute?.id);
      if (!selected) return;
      setSharePath({ id: selected.id, label: selected.mode, origin: planner.origin, destination: planner.destination, geometry: selected.geometry, distanceM: selected.distance, durationMinutes: selected.minutes, coordinateSystem: selected.coordinateSystem ?? 'schematic_demo' });
      router.push('/share-route');
    }}/></View>}
          </>}
        </ScrollView>
        <View style={styles.start}><PrimaryButton label="Start navigation" disabled={!planner.selectedRoute || !destinationPoint || locating} onPress={() => {
          if (planner.selectedRoute && destinationPoint) { setSelecting(null); void session.start(planner.selectedRoute, destinationPoint, toRoutePreferences(preferences), demoClosure); }
        }}/><SecondaryButton label="Report Barrier" onPress={() => setReporting(true)}/></View>
      </View>}
    {reporting && <BarrierModal route={reportRoute} pending={demoReport} active={demoClosure} starting={navigation.status === 'starting'} onClose={() => setReporting(false)} onRecord={setDemoReport} onActivate={() => void changeClosure(true)}/>}
  </View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.map },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.space.md, paddingTop: theme.space.xs, paddingBottom: theme.space.xxs, gap: theme.space.xxs },
  brand: { ...type.title, fontWeight: '800', color: theme.color.accent },
  eyebrow: { ...type.caption, fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  search: { flexGrow: 0, maxHeight: '30%', margin: theme.space.sm, backgroundColor: theme.color.surface, borderRadius: theme.radius.lg, ...theme.elevation.sheet },
  mapSpace: { flex: 1, justifyContent: 'flex-end' },
  controls: { alignSelf: 'flex-end', alignItems: 'flex-end', gap: theme.space.xxs, margin: theme.space.sm },
  attribution: { ...type.caption, fontSize: 10, lineHeight: 14, backgroundColor: theme.color.surface, paddingHorizontal: theme.space.xxs, borderRadius: theme.radius.sm },
  guidance: { maxHeight: '30%' }, navigationBottom: { maxHeight: '42%' },
  selection: { margin: theme.space.sm, padding: theme.space.sm, gap: theme.space.xs, backgroundColor: theme.color.surface, borderRadius: theme.radius.md },
  sheet: { flexShrink: 1, backgroundColor: theme.color.surface, borderTopLeftRadius: theme.radius.sheet, borderTopRightRadius: theme.radius.sheet, ...theme.elevation.sheet },
  handle: { alignSelf: 'center', width: 32, height: 4, borderRadius: theme.radius.pill, backgroundColor: theme.color.outline, marginTop: theme.space.xs },
  priority: { flexDirection: 'row', paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs, gap: theme.space.xs, alignItems: 'flex-start' },
  comparison: { flexShrink: 1 },
  start: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs, paddingHorizontal: theme.space.md, paddingVertical: theme.space.xs, borderTopWidth: 1, borderTopColor: theme.color.raised },
  demoNotice: { paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs, gap: theme.space.xxs },
  message: { ...type.body, padding: theme.space.md },
  mapActions: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.space.md, paddingVertical: theme.space.xs, gap: theme.space.xs },
});

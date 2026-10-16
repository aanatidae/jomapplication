import { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { theme, type } from '../../theme/tokens';
import { DemoControls } from './DemoControls';
import { MapCanvas } from './MapCanvas';
import { PlannerState } from './PlannerState';
import { RouteComparisonSheet } from './RouteComparisonSheet';
import { TripSearchBar } from './TripSearchBar';
import { getDemoRoutes, longPlace, type DemoState, type RouteProfile } from './mockRoutes';

export function PlannerScreen({ initialState = 'ready', initialWorstCase = false, initialExpanded = true }: { initialState?: DemoState; initialWorstCase?: boolean; initialExpanded?: boolean } = {}) {
  const [origin, setOrigin] = useState('Transit Stop');
  const [destination, setDestination] = useState('Community Mall');
  const [selected, setSelected] = useState<RouteProfile>('fastest');
  const [expanded, setExpanded] = useState(initialExpanded);
  const [state, setState] = useState<DemoState>(initialState);
  const [controls, setControls] = useState(false);
  const [worstCase, setWorstCase] = useState(initialWorstCase);
  const [manualOrigin, setManualOrigin] = useState(false);
  const { fontScale } = useWindowDimensions();
  const noTrip = origin === destination;
  const showRoutes = !noTrip && ['ready', 'unknown', 'mapUnavailable', 'permissionDenied'].includes(state);
  const visibleRoutes = getDemoRoutes(state, worstCase);
  const routeFailure = !showRoutes && !noTrip && state !== 'ready' && state !== 'unknown' ? state : null;
  const resetState = () => setState('ready');
  const displayedDestination = worstCase ? longPlace : destination;
  function changePlace(field: 'origin' | 'destination', value: string) {
    if (field === 'origin') setOrigin(value);
    else setDestination(value);
    resetState();
  }
  let canvas;
  if (noTrip) {
    canvas = <PlannerState state="empty" onRetry={() => {
      setOrigin('Transit Stop');
      setDestination('Community Mall');
    }} />;
  } else if (state === 'mapUnavailable') {
    canvas = <PlannerState state="mapUnavailable" onRetry={resetState} />;
  } else {
    canvas = <MapCanvas selected={selected} origin={origin} destination={displayedDestination}
      overlap={worstCase} compact={fontScale > 1.5} routesVisible={showRoutes} />;
  }
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.header}>
      <Text style={type.display}>Jom!</Text>
      <View style={styles.headerEnd}>
        <Text accessibilityRole="header" style={type.label}>Planner</Text>
        <Text style={type.caption}>Walking · Demo</Text>
      </View>
    </View>
    <TripSearchBar origin={origin} destination={displayedDestination} onChange={changePlace}
      requestedField={manualOrigin ? 'origin' : null} onClose={() => setManualOrigin(false)} />
    {canvas}
    {state === 'permissionDenied' && <PlannerState state="permissionDenied" onRetry={() => setManualOrigin(true)} />}
    {showRoutes && <RouteComparisonSheet routes={visibleRoutes} selected={selected} onSelect={setSelected}
      expanded={expanded} onToggle={() => setExpanded(!expanded)} />}
    {routeFailure && <PlannerState state={routeFailure} onRetry={resetState} />}
    {__DEV__ && <DemoControls open={controls} onToggle={() => setControls(!controls)} state={state}
      onState={setState} worstCase={worstCase} onWorstCase={setWorstCase} />}
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.background },
  content: { width: '100%', maxWidth: theme.layout.contentMax, alignSelf: 'center', paddingBottom: theme.space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.space.md, padding: theme.space.md, backgroundColor: theme.color.surface, alignItems: 'center' },
  headerEnd: { flexShrink: 1, alignItems: 'flex-end' },
});

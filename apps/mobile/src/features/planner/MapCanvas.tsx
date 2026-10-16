import { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { theme, type } from '../../theme/tokens';
import { routes, type Point, type RouteProfile } from './mockRoutes';

// Schematic geometry in local 0..1 canvas units. No geographic or safety data.
function Segment({ a, b, width, height, selected }: { a: Point; b: Point; width: number; height: number; selected: boolean }) {
  const x = a[0] * width; const y = a[1] * height;
  const dx = (b[0] - a[0]) * width; const dy = (b[1] - a[1]) * height;
  const length = Math.hypot(dx, dy);
  return <View style={{ position: 'absolute', left: x + dx / 2 - length / 2, top: y + dy / 2 - (selected ? 4 : 2), width: length, height: selected ? 8 : 4, borderRadius: theme.radius.sm, backgroundColor: selected ? theme.color.accent : theme.color.alternateRoute, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] }} />;
}
export function MapCanvas({ selected, origin, destination, overlap = false, compact = false, routesVisible = true }: { selected: RouteProfile; origin: string; destination: string; overlap?: boolean; compact?: boolean; routesVisible?: boolean }) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { fontScale } = useWindowDimensions();
  const markerSize = theme.icon.lg * Math.max(1, fontScale);
  const markerScale = { width: markerSize, height: markerSize, marginLeft: -markerSize / 2, marginTop: -markerSize / 2 };
  const selectedRoute = routes.find(r => r.id === selected)!;
  const routeSummary = routesVisible ? `Selected ${selectedRoute.mode}, ${selectedRoute.minutes} minutes. Three routes share the same endpoints.` : 'No route is displayed.';
  return <View accessible accessibilityRole="image" accessibilityLabel={`Schematic demo map, not for navigation. From ${origin} to ${destination}. ${routeSummary}`} style={styles.frame}>
    <View style={styles.legend}><Text style={type.label}>{routesVisible ? `${selectedRoute.mode} · ${selectedRoute.minutes} min` : 'Demo area'}</Text><Text style={type.caption}>{routesVisible ? 'Thick line = selected route' : 'No route displayed'}</Text></View>
    <View onLayout={e => setSize(e.nativeEvent.layout)} style={[styles.map, { height: compact ? theme.layout.mapCompactHeight : theme.layout.mapHeight }]}>
    <View style={styles.park} /><View style={styles.water} />
    {[0.15, 0.30, 0.52, 0.75].map(y => <View key={`h${y}`} style={[styles.road, { top: `${y * 100}%`, width: '100%', height: 18 }]} />)}
    {[0.16, 0.40, 0.65, 0.82].map(x => <View key={`v${x}`} style={[styles.road, { left: `${x * 100}%`, height: '100%', width: 18 }]} />)}
    {!compact && <Text style={[type.caption, styles.parkLabel]}>Neighbourhood park</Text>}
    {routesVisible && size.width > 0 && [...routes.filter(r => r.id !== selected), selectedRoute].map(r => {
      const geometry = overlap ? selectedRoute.geometry : r.geometry;
      return geometry.slice(1).map((p, i) => <Segment key={`${r.id}-${i}`} a={geometry[i]} b={p} width={size.width} height={size.height} selected={r.id === selected} />);
    })}
    <View style={[styles.marker, markerScale, styles.start]}><Text style={styles.markerText}>A</Text></View>
    <View style={[styles.marker, markerScale, styles.end]}><Text style={styles.markerText}>B</Text></View>
    </View>
    <Text style={[type.caption, styles.demo]}>Schematic demo map · Not for navigation</Text>
  </View>;
}
const styles = StyleSheet.create({
  frame: { backgroundColor: theme.color.map },
  map: { backgroundColor: theme.color.map, overflow: 'hidden' },
  road: { position: 'absolute', backgroundColor: theme.color.road },
  park: { position: 'absolute', left: '20%', top: '35%', width: '38%', height: '32%', backgroundColor: theme.color.park, borderRadius: theme.radius.lg },
  water: { position: 'absolute', right: '-8%', top: '-10%', width: '16%', height: '120%', backgroundColor: theme.color.water, transform: [{ rotate: '15deg' }] },
  parkLabel: { position: 'absolute', left: '22%', top: '43%', maxWidth: '33%', fontSize: 14 },
  marker: { position: 'absolute', width: theme.icon.lg, height: theme.icon.lg, borderRadius: theme.radius.pill, backgroundColor: theme.color.ink, justifyContent: 'center', alignItems: 'center', marginLeft: -16, marginTop: -16, borderWidth: 2, borderColor: theme.color.surface },
  markerText: { color: theme.color.onAccent, fontSize: 16, fontWeight: '700' },
  start: { left: '16%', top: '75%' }, end: { left: '82%', top: '30%' },
  legend: { paddingHorizontal: theme.space.md, paddingVertical: theme.space.xs },
  demo: { paddingHorizontal: theme.space.md, paddingVertical: theme.space.xs },
});

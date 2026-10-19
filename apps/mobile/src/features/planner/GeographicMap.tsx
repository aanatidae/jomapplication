import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import type { MockRoute } from './mockRoutes';
import { brickfieldsCenter, type GeographicPoint } from './geographic';
import { LeafletMap } from './LeafletMap';

export type GeographicMapProps = {
  selected: string; origin: string; destination: string; routeOptions?: readonly MockRoute[];
  routesVisible?: boolean; compact?: boolean; originPoint?: GeographicPoint; destinationPoint?: GeographicPoint;
  currentLocation?: GeographicPoint; onPick?: (point: GeographicPoint) => void; selectionLabel?: string;
};
export function GeographicMap(props: GeographicMapProps) {
  return process.env.EXPO_PUBLIC_MAP_RENDERER === 'native' ? <NativeGeographicMap {...props}/> : <LeafletMap {...props}/>;
}
function NativeGeographicMap({ selected, origin, destination, routeOptions = [], routesVisible = true,
  compact, originPoint, destinationPoint, currentLocation, onPick, selectionLabel }: GeographicMapProps) {
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const selectedRoute = routeOptions.find(r => r.id === selected);
  const geometry = routesVisible ? selectedRoute?.geometry : undefined;
  useEffect(() => {
    if (!ready || !geometry?.length) return;
    map.current?.fitToCoordinates(geometry.map(([longitude, latitude]) => ({ latitude, longitude })), {
      edgePadding: { top: 44, right: 44, bottom: 44, left: 44 }, animated: false,
    });
  }, [geometry, ready]);
  useEffect(() => {
    if (!ready || !currentLocation) return;
    map.current?.animateToRegion({ ...currentLocation, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 0);
  }, [currentLocation, ready]);
  const summary = routesVisible && selectedRoute ? `Selected ${selectedRoute.mode}, ${selectedRoute.minutes} minutes. ${routeOptions.length} route options.` : 'No route is displayed.';
  return <View style={styles.frame}>
    <View style={styles.legend}><Text style={type.label}>Brickfields · Kuala Lumpur</Text>
      <Text style={type.caption}>{selectionLabel ?? 'Pan and pinch to zoom · Thick line = selected route'}</Text></View>
    <View accessible accessibilityRole="image" accessibilityLabel={`Interactive geographic map. From ${origin} to ${destination}. ${summary}`}
      style={{ height: compact ? theme.layout.mapCompactHeight : theme.layout.mapHeight }}>
      {Platform.OS === 'web' ? <Text style={type.body}>Open the Expo app on Android or iOS to use the interactive map.</Text> :
      <MapView ref={map} style={StyleSheet.absoluteFill} initialRegion={{ ...brickfieldsCenter, latitudeDelta: 0.018, longitudeDelta: 0.018 }}
        onMapReady={() => setReady(true)} onMapLoaded={() => setUnavailable(false)}
        onPress={event => onPick?.(event.nativeEvent.coordinate)} zoomEnabled scrollEnabled rotateEnabled
        showsBuildings showsPointsOfInterests showsUserLocation={false} showsMyLocationButton={false}
        loadingEnabled>
        {routesVisible && [...routeOptions.filter(r => r.id !== selected), ...routeOptions.filter(r => r.id === selected)].map(route =>
          <Polyline key={route.id} coordinates={route.geometry.map(([longitude, latitude]) => ({ latitude, longitude }))}
            strokeWidth={route.id === selected ? 7 : 4} strokeColor={route.id === selected ? theme.color.accent : theme.color.alternateRoute} zIndex={route.id === selected ? 2 : 1} />)}
        {originPoint && <Marker coordinate={originPoint} title={`A · ${origin}`} pinColor={theme.color.accent} />}
        {destinationPoint && <Marker coordinate={destinationPoint} title={`B · ${destination}`} />}
        {currentLocation && <Marker coordinate={currentLocation} title="Current location" pinColor={theme.color.ink} />}
        {geometry && [geometry[0], geometry[geometry.length - 1]].map(([longitude, latitude], index) =>
          <Marker key={index} coordinate={{ latitude, longitude }} title={index === 0 ? 'Mapped route start' : 'Mapped route end'} pinColor={theme.color.alternateRoute} />)}
      </MapView>}
    </View>
    <View style={styles.legend}>
      <Text style={type.caption}>Routes: OpenStreetMap contributors · Basemap: {Platform.OS === 'ios' ? 'Apple Maps' : 'Google Maps'}</Text>
      <Text accessibilityRole="link" style={[type.caption, styles.link]} onPress={() => void Linking.openURL('https://www.openstreetmap.org/copyright')}>© OpenStreetMap contributors · ODbL</Text>
      {unavailable && <Text accessibilityLiveRegion="polite" style={type.caption}>Map tiles unavailable. Check your connection and map provider configuration. Manual place selection remains available.</Text>}
      <SecondaryButton label={unavailable ? 'Hide map help' : 'Map not loading?'} onPress={() => setUnavailable(value => !value)} />
    </View>
  </View>;
}
const styles = StyleSheet.create({
  frame: { backgroundColor: theme.color.map },
  legend: { paddingHorizontal: theme.space.md, paddingVertical: theme.space.xs, gap: theme.space.xs },
  link: { textDecorationLine: 'underline' },
});

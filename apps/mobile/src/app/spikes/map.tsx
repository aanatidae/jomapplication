import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

// Simulated geometry for renderer testing only, not a pedestrian route claim.
const coordinates = [
  { latitude: 3.1, longitude: 101.6 },
  { latitude: 3.101, longitude: 101.601 },
  { latitude: 3.1, longitude: 101.602 },
];

export default function MapSpike() {
  const [ready, setReady] = useState(false);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.notice}>
        <Text accessibilityRole="header" style={styles.title}>Jom! map spike</Text>
        <Text>Simulated demo geometry. Safety and accessibility unknown.</Text>
        <Text testID="map-status" accessibilityLiveRegion="polite">
          {ready ? 'Native map ready' : 'Waiting for native map'}
        </Text>
      </View>
      <MapView
        style={styles.map}
        initialRegion={{ ...coordinates[1], latitudeDelta: 0.008, longitudeDelta: 0.008 }}
        onMapReady={() => setReady(true)}
        showsUserLocation={false}
      >
        <Marker coordinate={coordinates[0]} title="Demo origin" />
        <Marker coordinate={coordinates[2]} title="Demo destination" />
        <Polyline coordinates={coordinates} strokeWidth={5} />
      </MapView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  notice: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '600' },
  map: { flex: 1 },
});

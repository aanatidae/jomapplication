import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import type { GeographicMapProps } from './GeographicMap';
import { leafletDocument, scriptJson } from './leafletDocument';

const source = { html: leafletDocument, baseUrl: 'https://github.com/aanatidae/jomapplication/' };
export function LeafletMap({ selected, origin, destination, routeOptions = [], routesVisible = true,
  compact, originPoint, destinationPoint, currentLocation, onPick, selectionLabel }: GeographicMapProps) {
  const web = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tileLoaded, setTileLoaded] = useState(false);
  const state = scriptJson({ selected, routes: routesVisible ? routeOptions.map(r => ({ id: r.id, geometry: r.geometry })) : [], origin: originPoint, destination: destinationPoint, currentLocation });
  useEffect(() => {
    if (ready) web.current?.injectJavaScript(`window.jomUpdate(${state});true;`);
  }, [ready, state]);
  useEffect(() => {
    if (tileLoaded) return;
    const timer = setTimeout(() => setFailed(true), 15000);
    return () => clearTimeout(timer);
  }, [tileLoaded]);
  const route = routeOptions.find(r => r.id === selected);
  const summary = routesVisible && route ? `Selected ${route.mode}, ${route.minutes} minutes.` : 'No route is displayed.';
  return <View style={styles.frame}>
    <View style={styles.legend}><Text style={type.label}>Brickfields · Kuala Lumpur</Text>
      <Text style={type.caption}>{selectionLabel ?? 'Pan and pinch to zoom · A = start · B = destination'}</Text></View>
    <View accessible accessibilityRole="image" accessibilityLabel={`Interactive geographic map. From ${origin} to ${destination}. ${summary}`}
      style={{ height: compact ? theme.layout.mapCompactHeight : theme.layout.mapHeight }}>
      {Platform.OS === 'web' ? <Text style={type.body}>Open Jom! in Expo on Android or iOS to use the interactive map.</Text> :
      <WebView ref={web} source={source} style={styles.web} originWhitelist={['https://github.com', 'about:blank']}
        textZoom={100}
        javaScriptEnabled cacheEnabled cacheMode="LOAD_DEFAULT" domStorageEnabled={false}
        applicationNameForUserAgent="JomBrickfields/1.0 (+https://github.com/aanatidae/jomapplication)"
        mixedContentMode="never" allowFileAccess={false} geolocationEnabled={false} setSupportMultipleWindows={false}
        onShouldStartLoadWithRequest={request => {
          if (request.url === source.baseUrl || request.url === 'about:blank') return true;
          if (request.url === 'https://www.openstreetmap.org/copyright') void Linking.openURL(request.url);
          return false;
        }}
        onError={() => setFailed(true)}
        onMessage={event => {
          try {
            const message: unknown = JSON.parse(event.nativeEvent.data);
            if (!message || typeof message !== 'object' || !('type' in message)) return;
            if (message.type === 'ready') setReady(true);
            if (message.type === 'tile_loaded') { setTileLoaded(true); setFailed(false); }
            if (message.type === 'tile_error') setFailed(true);
            if (message.type === 'pick' && 'latitude' in message && 'longitude' in message &&
              typeof message.latitude === 'number' && Number.isFinite(message.latitude) && Math.abs(message.latitude) <= 90 &&
              typeof message.longitude === 'number' && Number.isFinite(message.longitude) && Math.abs(message.longitude) <= 180) {
              onPick?.({ latitude: message.latitude, longitude: message.longitude });
            }
          } catch { /* Ignore malformed WebView messages. */ }
        }} />}
    </View>
    <View style={styles.legend}>
      <Text style={type.caption}>Thick line = selected route · Small circles = mapped route endpoints</Text>
      <Text style={type.caption}>© OpenStreetMap contributors · ODbL · Accessibility and safety coverage incomplete</Text>
      {failed && <><Text accessibilityLiveRegion="polite" style={type.caption}>Map tiles unavailable. Check your connection. Manual place selection remains available.</Text>
        <SecondaryButton label="Retry map" onPress={() => { setFailed(false); setReady(false); setTileLoaded(false); web.current?.reload(); }} /></>}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  frame: { backgroundColor: theme.color.map },
  legend: { paddingHorizontal: theme.space.md, paddingVertical: theme.space.xs, gap: theme.space.xs },
  web: { flex: 1, backgroundColor: theme.color.map },
});

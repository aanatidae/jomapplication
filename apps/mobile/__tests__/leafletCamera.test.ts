import { leafletDocument } from '../src/features/planner/leafletDocument';

const { runInNewContext } = require('node:vm') as { runInNewContext: (code: string, context: object) => unknown };

it('follows at walking zoom inside the visible area, respects exploration/recenter and uses only valid headings', () => {
  const events: Record<string, () => void> = {};
  const layer = { addTo: jest.fn().mockReturnThis(), on: jest.fn(), remove: jest.fn(), clearLayers: jest.fn() };
  const marker = { ...layer, setIcon: jest.fn(), setLatLng: jest.fn(), getElement: () => ({ style: {} }) };
  const map = {
    on: (event: string, handler: () => void) => { events[event] = handler; },
    getContainer: () => ({ addEventListener: jest.fn() }),
    getSize: () => ({ y: 800 }), stop: jest.fn(), setView: jest.fn(),
    project: ([latitude, longitude]: number[]) => ({ x: longitude, y: latitude }),
    unproject: ({ x, y }: { x: number; y: number }) => [y, x],
    attributionControl: { addAttribution: jest.fn() },
  };
  const divIcon = jest.fn(value => value);
  const state = {
    routes: [], selected: '', navigating: true, following: true, reducedMotion: true,
    currentLocation: { latitude: 3.13, longitude: 101.68 }, heading: undefined as number | undefined,
    insets: { top: 80, bottom: 200 },
  };
  const window = {
    jomUpdate: (_state: typeof state) => {},
    ReactNativeWebView: { postMessage: jest.fn() }, addEventListener: jest.fn(),
  };
  // Execute the actual bridge/camera code with Leaflet's imperative surface mocked.
  const source = 'const send=value=>' + leafletDocument.split('const send=value=>')[1].split('</script>')[0];
  runInNewContext(source, { window, document: { createElement: () => ({ textContent: '' }) },
    L: { map: () => map, tileLayer: () => layer, circle: () => layer, layerGroup: () => layer,
      polyline: () => layer, marker: () => marker, divIcon } });
  window.jomUpdate(state);
  expect(map.setView).toHaveBeenLastCalledWith([63.13, 101.68], 19, { animate: false, duration: 0.25 });
  expect(divIcon.mock.calls.at(-1)![0].html).toBe('');
  state.currentLocation = { latitude: 3.14, longitude: 101.69 };
  state.heading = 90;
  window.jomUpdate(state);
  expect(marker.setLatLng).toHaveBeenLastCalledWith([3.14, 101.69]);
  expect(map.setView).toHaveBeenLastCalledWith([63.14, 101.69], 19, expect.anything());
  expect(divIcon.mock.calls.at(-1)![0].html).toContain('rotate(90deg)');
  events.dragstart();
  map.setView.mockClear();
  state.currentLocation = { latitude: 3.15, longitude: 101.7 };
  window.jomUpdate(state);
  expect(map.setView).not.toHaveBeenCalled();
  state.following = false; window.jomUpdate(state);
  state.following = true; window.jomUpdate(state);
  expect(map.setView).toHaveBeenCalledTimes(1);
  state.heading = NaN; window.jomUpdate(state);
  expect(divIcon.mock.calls.at(-1)![0].html).toBe('');
  state.navigating = false; window.jomUpdate(state);
  expect(map.setView.mock.calls.at(-1)![1]).toBe(17);
  state.navigating = true; window.jomUpdate(state);
  expect(map.setView.mock.calls.at(-1)![1]).toBe(19);
});

it('places the accessible demo X at the supplied graph coordinate, retains it on reroute and removes it on reset', () => {
  const layer = { addTo: jest.fn().mockReturnThis(), on: jest.fn(), clearLayers: jest.fn() };
  const element = { setAttribute: jest.fn() };
  const marker = { ...layer, bindPopup: jest.fn(), getElement: () => element };
  const createMarker = jest.fn(() => marker);
  const map = { on: jest.fn(), getContainer: () => ({ addEventListener: jest.fn() }),
    getSize: () => ({ y: 800 }), attributionControl: { addAttribution: jest.fn() } };
  const window = { jomUpdate: (_state: object) => {}, addEventListener: jest.fn(), ReactNativeWebView: { postMessage: jest.fn() } };
  const source = 'const send=value=>' + leafletDocument.split('const send=value=>')[1].split('</script>')[0];
  runInNewContext(source, { window, document: { createElement: () => ({ textContent: '' }) },
    L: { map: () => map, tileLayer: () => layer, circle: () => layer, layerGroup: () => layer,
      polyline: () => layer, circleMarker: () => layer, marker: createMarker, divIcon: (value: object) => value } });
  const crossing = { latitude: 3.1336672, longitude: 101.6884742 };
  const state = { routes: [], selected: '', navigating: true, demoBlockage: undefined as typeof crossing | undefined };
  window.jomUpdate(state); expect(createMarker).not.toHaveBeenCalled();
  state.demoBlockage = crossing; window.jomUpdate(state);
  expect(createMarker).toHaveBeenLastCalledWith([crossing.latitude, crossing.longitude], expect.objectContaining({ zIndexOffset: 2000, title: 'Simulated blocked pedestrian crossing' }));
  expect(element.setAttribute).toHaveBeenCalledWith('aria-label', 'Simulated blocked pedestrian crossing');
  expect(marker.bindPopup).toHaveBeenCalledWith(expect.stringContaining('Hackathon demo'));
  const count = createMarker.mock.calls.length;
  window.jomUpdate({ ...state, selected: 'recalculated', routes: [{ id: 'recalculated', geometry: [[101.687, 3.133], [101.690, 3.131]] }] });
  expect(createMarker).toHaveBeenCalledTimes(count + 1);
  createMarker.mockClear(); layer.clearLayers.mockClear();
  window.jomUpdate({ ...state, demoBlockage: undefined });
  expect(layer.clearLayers).toHaveBeenCalled(); expect(createMarker).not.toHaveBeenCalled();
});

/* global jest */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
process.env.EXPO_PUBLIC_DATA_MODE = 'local';
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({ fitToCoordinates: jest.fn(), animateToRegion: jest.fn() }));
      return React.createElement(View, { ...props, testID: 'native-map' });
    }),
    Marker: props => React.createElement(View, { ...props, testID: 'map-marker' }),
    Polyline: props => React.createElement(View, { ...props, testID: 'map-polyline' }),
  };
});
jest.mock('expo-location', () => ({
  getForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  hasServicesEnabledAsync: jest.fn(async () => true),
  watchPositionAsync: jest.fn(async () => ({ remove: jest.fn() })),
  watchHeadingAsync: jest.fn(async () => ({ remove: jest.fn() })),
  requestForegroundPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getCurrentPositionAsync: jest.fn(), Accuracy: { Balanced: 3, High: 4 },
}));
jest.mock('react-native-webview', () => {
  const React = require('react'); const { View } = require('react-native');
  return { WebView: React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ injectJavaScript: jest.fn(), reload: jest.fn() }));
    return React.createElement(View, { ...props, testID: 'leaflet-map' });
  }) };
});
// Runtime-only mock: do not pull the vendor's untyped source mock into app TypeScript.
jest.mock('react-native-worklets', () => require('react-native-worklets/' + 'src/mock'));
// Router also imports this mock directly; extend that shared test boundary.
jest.mock('react-native-reanimated/mock', () => ({ ...jest.requireActual('react-native-reanimated/mock'), cubicBezier: (...points) => ({ points }) }));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('expo-haptics', () => ({ AndroidHaptics: { Segment_Tick: 'segment-tick', Confirm: 'confirm' }, NotificationFeedbackType: { Success: 'success' }, performAndroidHapticsAsync: jest.fn(async () => {}), selectionAsync: jest.fn(async () => {}), notificationAsync: jest.fn(async () => {}) }));

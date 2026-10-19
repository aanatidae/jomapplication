// Native Maps SDK keys are public client keys: restrict by package/signing certificate.
// Expo Go supplies its own native map configuration. EAS builds need this environment value.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '' }],
    ['expo-location', { locationWhenInUsePermission: 'Use your location as the start of a walking route. You can also choose a start manually.' }],
  ],
});

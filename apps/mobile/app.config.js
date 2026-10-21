// The default Leaflet map needs no key. Optional native maps resolve this
// placeholder from a local Gradle property or environment at build time.
// Restrict any Maps client key by package/signing certificate.
module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ['react-native-maps', { androidGoogleMapsApiKey: '${GOOGLE_MAPS_ANDROID_API_KEY}' }],
    './plugins/withAndroidStudio',
  ],
});

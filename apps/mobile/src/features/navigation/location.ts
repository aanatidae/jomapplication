import * as Location from 'expo-location';
import { planRoutes } from '../../services/routingApi';
import type { Fix, NavigationPorts } from './session';

export const toFix = (value: Location.LocationObject): Fix => ({ ...value.coords, timestamp: value.timestamp });
export const locationPorts: NavigationPorts = {
  permission: async () => (await Location.requestForegroundPermissionsAsync()).granted,
  services: () => Location.hasServicesEnabledAsync(),
  current: async () => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      return toFix(await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High, mayShowUserSettingsDialog: false }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Location signal unavailable. Move into an open area and try Start again.')), 15000); }),
      ]));
    } finally { if (timer) clearTimeout(timer); }
  },
  watch: (update, error) => Location.watchPositionAsync({
    accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 2, mayShowUserSettingsDialog: false,
  }, value => update(toFix(value)), error),
  heading: update => Location.watchHeadingAsync(value => {
    const heading = value.trueHeading >= 0 ? value.trueHeading : value.magHeading;
    update(value.accuracy >= 2 && Number.isFinite(heading) && heading >= 0 ? heading : undefined);
  }),
  routes: planRoutes,
  now: Date.now,
};

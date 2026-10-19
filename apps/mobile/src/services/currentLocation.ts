import * as Location from 'expo-location';
import type { GeographicPoint } from '../features/planner/geographic';

export class LocationUnavailable extends Error {
  constructor(public readonly reason: 'denied' | 'unavailable') { super(reason); }
}
// Called only after the user taps Use current location. No background access/history.
export async function getCurrentOrigin(): Promise<GeographicPoint> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) throw new LocationUnavailable('denied');
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, mayShowUserSettingsDialog: false }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new LocationUnavailable('unavailable')), 15000); }),
    ]);
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch { throw new LocationUnavailable('unavailable'); }
  finally { if (timer) clearTimeout(timer); }
}

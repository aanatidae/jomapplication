import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Native feedback respects platform settings. Unsupported hardware must never block a commit.
export function selectionFeedback() {
  if (Platform.OS === 'android') void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Segment_Tick).catch(() => {});
  else if (Platform.OS === 'ios') void Haptics.selectionAsync().catch(() => {});
}
export function successFeedback() {
  if (Platform.OS === 'android') void Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm).catch(() => {});
  else if (Platform.OS === 'ios') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

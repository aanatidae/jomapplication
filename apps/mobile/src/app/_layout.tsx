import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreferencesProvider } from '../features/preferences/PreferencesProvider';

export default function Layout() {
  return <SafeAreaView style={{ flex: 1 }} edges={[]}><PreferencesProvider><Stack screenOptions={{ headerShown: false, animation: 'none' }} /></PreferencesProvider></SafeAreaView>;
}

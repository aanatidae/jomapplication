import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PreferencesProvider } from '../features/preferences/PreferencesProvider';
import { AuthGate } from '../services/supabase/AuthGate';

export default function Layout() {
  return <SafeAreaView style={{ flex: 1 }} edges={[]}><AuthGate><PreferencesProvider><Stack screenOptions={{ headerShown: false, animation: 'none' }} /></PreferencesProvider></AuthGate></SafeAreaView>;
}

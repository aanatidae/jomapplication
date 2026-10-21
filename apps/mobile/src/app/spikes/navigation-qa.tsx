import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { SecondaryButton } from '../../components/Buttons';
import { NavigationGuidance, NavigationProgress } from '../../features/navigation/NavigationPanels';
import type { NavigationState } from '../../features/navigation/session';
import { theme, type } from '../../theme/tokens';

const states = ['Demo data', 'Worst case', 'GPS unavailable', 'Recalculating', 'Arrived'] as const;
export default function NavigationQA() {
  const [mode, setMode] = useState<(typeof states)[number]>('Demo data');
  if (!__DEV__) return <Text>Development preview unavailable.</Text>;
  const worst = mode === 'Worst case';
  const state: NavigationState = {
    status: mode === 'Arrived' ? 'arrived' : 'active', following: false, rerouting: mode === 'Recalculating',
    remainingM: worst ? 1999 : 128, remainingS: worst ? 1999 : 100,
    warning: mode === 'GPS unavailable' ? 'No recent location update. You may be stationary or the GPS signal may be unavailable. Progress waits for a fresh reading.' : undefined,
    error: worst ? 'No step-free route could be verified for this destination. Missing curb-cut and entrance information remains unknown. Your profile has been preserved.' : undefined,
  };
  return <SafeAreaView style={{ flex: 1, backgroundColor: theme.color.map }}>
    <Text style={type.label}>UI preview only · No GPS tracking</Text>
    <NavigationGuidance state={state} destination={worst ? 'Buddhist Maha Vihara — visitor entrance beside the community information centre and pedestrian connection, Brickfields, Kuala Lumpur' : 'NU Sentral · main entrance'}/>
    <View style={{ flex: 1, justifyContent: 'center', padding: theme.space.md }}><Text style={type.body}>Static UI fixture. Use Planner for real GPS navigation.</Text></View>
    <View style={{ maxHeight: '40%' }}><NavigationProgress state={state} onStop={() => router.replace('/')} onResume={() => setMode('Demo data')} onRetry={() => setMode('Recalculating')}/></View>
    <ScrollView horizontal style={{ flexGrow: 0 }} contentContainerStyle={{ padding: theme.space.xs, gap: theme.space.xs }}>
      {states.map(value => <SecondaryButton key={value} label={value} onPress={() => setMode(value)}/>)}
    </ScrollView>
  </SafeAreaView>;
}

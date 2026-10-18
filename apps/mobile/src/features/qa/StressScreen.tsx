import { useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { FormPage, form } from '../../components/Forms';
import { SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import { CommunityScreen } from '../community/CommunityScreen';
import { ShareScreen } from '../community/ShareScreen';
import { DetailScreen } from '../community/DetailScreen';
import { OnboardingScreen } from '../preferences/Screens';
import { ReportScreen } from '../barriers/ReportScreen';
import { createCommunityRepository } from '../community/repository';
import { createBarrierRepository } from '../barriers/repository';
import { seededCommunityRoutes, seedPaths } from '../community/data';
import { accessibilityTags, purposeTags, routeWarnings } from '../community/types';
import { routeLocations } from '../barriers/model';
export const worstTitle = 'Covered connection from the transit interchange to the community plaza and accessible north entrance';
export const worstNotes = ('The north entrance may close early. Check the ramp and crossing before continuing. ').repeat(25).slice(0, 2000);
export const worstCommunity = [
  { ...seededCommunityRoutes[0], title: worstTitle, notes: worstNotes, purposeTags: [...purposeTags], accessibilityTags: ['Step-free', 'Ramp available', 'Accessible entrance', 'Elevator required'], routeWarnings: [...routeWarnings], lastWalkedAt: undefined, author: 'Aleksandra Wiśniewska-Kowalczyk' },
  { ...seededCommunityRoutes[1], title: 'J · 王秀英 · Jalan pejalan kaki', author: 'Jo', lastWalkedAt: '2026-01-01', verificationLevel: 'confirmed' as const, photos: ['file:///missing-photo.jpg'] },
];
function StressSurface({ surface, mode }: { surface: string; mode: string }) {
  const [dependencies] = useState(() => {
    const values = new Map<string, string>();
    const storage = { getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => { if (mode === 'error') throw new Error('Demo storage failure'); values.set(key, value); } };
    return { community: createCommunityRepository(storage, mode === 'empty' ? [] : mode === 'worst' ? worstCommunity : seededCommunityRoutes), barriers: createBarrierRepository(storage) };
  });
  const [finished, setFinished] = useState(false);
  const worst = mode === 'worst';
  const failing = mode === 'error';
  if (surface === 'onboarding') return finished ? <FormPage title="Onboarding preview complete"><Text style={type.body}>Preview only. Your saved preferences were not changed.</Text></FormPage> : <OnboardingScreen
    labels={worst ? { preferWellLit: 'Prefer well-lit pedestrian connections around entrances and public transport interchanges', preferPublicAreas: 'Prefer active and public spaces with visible pedestrian activity during this walk' } : undefined}
    onComplete={async () => { if (mode === 'error') throw new Error('Demo save failure'); setFinished(true); }}/>;
  if (surface === 'share') return <ShareScreen repository={dependencies.community} initialDraft={worst ? { title: worstTitle, notes: worstNotes, route: seedPaths[1], purposeTags: [...purposeTags], accessibilityTags: accessibilityTags.filter(t => t !== 'Stairs present'), routeWarnings: [...routeWarnings], photos: ['file:///missing-photo.jpg'] } : failing ? { title: 'Local save retry demo', notes: 'This save is intentionally failing for QA.', route: seedPaths[1], purposeTags: ['Walking'], accessibilityTags: [], routeWarnings: [], photos: [] } : undefined}/>;
  if (surface === 'detail') return <DetailScreen id="plaza-walk" repository={dependencies.community}/>;
  if (surface === 'barrier') return <ReportScreen routeOverride={null} repository={dependencies.barriers} initialDraft={worst ? { category: 'construction', description: worstNotes, conditionType: 'temporary', location: routeLocations(null)[0] } : failing ? { category: 'blocked_walkway', description: 'This save is intentionally failing for QA.', conditionType: 'temporary', location: routeLocations(null)[0] } : undefined}/>;
  return <CommunityScreen repository={dependencies.community}/>;
}
export function StressScreen() {
  const params = useLocalSearchParams<{ surface?: string; data?: string }>();
  const [mode, setMode] = useState(params.data || 'demo'); const surface = params.surface || 'community';
  if (!__DEV__) return <FormPage title="Preview unavailable"><SecondaryButton label="Back to Planner" onPress={() => router.replace('/')}/></FormPage>;
  return <View style={{ flex: 1 }}><View style={{ flex: 1 }}><StressSurface key={`${surface}-${mode}`} surface={surface} mode={mode}/></View>
    <View style={{ padding: theme.space.xs, backgroundColor: theme.color.raised }}><Text allowFontScaling={false} style={type.caption}>QA · {surface} · {mode} · isolated data</Text><View style={form.row}>
      {[['demo', 'Demo data'], ['worst', 'Worst case'], ['empty', 'Empty'], ['error', 'Failed save']].map(([id, label]) => <Pressable key={id} accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: mode === id }} style={[form.choice, { flex: 1, padding: theme.space.xs }, mode === id && form.selected]} onPress={() => { setMode(id); router.setParams({ data: id }); }}><Text allowFontScaling={false} style={type.label}>{label}</Text></Pressable>)}</View>
    </View></View>;
}

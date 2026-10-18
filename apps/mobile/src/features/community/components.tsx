import { Text, View } from 'react-native';
import { Choice, form } from '../../components/Forms';
import { SecondaryButton } from '../../components/Buttons';
import { type } from '../../theme/tokens';
import { RouteReasonBadge } from '../planner/RouteBadges';
import { MapCanvas } from '../planner/MapCanvas';
import type { CommunityRoute, SharedPath } from './types';
import { freshnessDays, isStale, verificationLabel } from '../quality/policy';
import { FreshnessLabel, RouteWarningBanner, useQualityClock } from '../quality/components';
export function VerificationBadge({ level }: { level: unknown }) { return <RouteReasonBadge label={verificationLabel(level)}/>; }
export function TagChoices({ title, options, selected, onChange }: { title: string; options: string[]; selected: string[]; onChange: (tags: string[]) => void }) {
  return <View style={form.group}><Text style={type.title}>{title}</Text><View style={form.row}>{options.map(tag => <Choice key={tag} label={tag} selected={selected.includes(tag)} onPress={() => onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag])}/>)}</View></View>;
}
export function SharedMap({ route }: { route: SharedPath }) {
  return <MapCanvas compact selected={route.id} origin={route.origin} destination={route.destination} routeOptions={[{ id: route.id, mode: 'Shared demo route', minutes: route.durationMinutes, distance: route.distanceM, geometry: route.geometry, reasons: [], confidence: 'Community submitted', quality: 'community', freshness: '' }]}/>;
}
export function CommunityRouteCard({ route, onOpen }: { route: CommunityRoute; onOpen: () => void }) {
  const now = useQualityClock();
  return <View style={form.panel}><Text style={type.title}>{route.title}</Text>
    <Text style={type.body}>About {route.route.distanceM} m · {route.route.durationMinutes} min</Text>
    <View style={form.row}>{[...route.purposeTags, ...route.accessibilityTags].map(t => <RouteReasonBadge key={t} label={t}/>)}</View>
    <VerificationBadge level={route.verificationLevel}/><FreshnessLabel kind="Last walked" date={route.lastWalkedAt} now={now}/>
    {isStale(route.lastWalkedAt, freshnessDays.communityWalk, now) && <RouteWarningBanner text="Walk information is old · check current conditions"/>}
    <SecondaryButton label="View route" accessibilityHint={route.title} onPress={onOpen}/>
  </View>;
}

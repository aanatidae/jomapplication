import { Text, View } from 'react-native';
import { Choice, form } from '../../components/Forms';
import { SecondaryButton } from '../../components/Buttons';
import { type } from '../../theme/tokens';
import { RouteReasonBadge } from '../planner/RouteBadges';
import { MapCanvas } from '../planner/MapCanvas';
import type { CommunityRoute, SharedPath, VerificationLevel } from './types';
export const verificationLabels: Record<VerificationLevel, string> = { community_submitted: 'Community submitted', confirmed: 'Confirmed by multiple users', verified: 'Township/venue verified' };
export function VerificationBadge({ level }: { level: VerificationLevel }) { return <RouteReasonBadge label={verificationLabels[level]}/>; }
export function TagChoices({ title, options, selected, onChange }: { title: string; options: string[]; selected: string[]; onChange: (tags: string[]) => void }) {
  return <View style={form.group}><Text style={type.title}>{title}</Text><View style={form.row}>{options.map(tag => <Choice key={tag} label={tag} selected={selected.includes(tag)} onPress={() => onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag])}/>)}</View></View>;
}
export function SharedMap({ route }: { route: SharedPath }) {
  return <MapCanvas compact selected={route.id} origin={route.origin} destination={route.destination} routeOptions={[{ id: route.id, mode: 'Shared demo route', minutes: route.durationMinutes, distance: route.distanceM, geometry: route.geometry, reasons: [], confidence: 'Community submitted', quality: 'community', freshness: '' }]}/>;
}
export function CommunityRouteCard({ route, onOpen }: { route: CommunityRoute; onOpen: () => void }) {
  return <View style={form.panel}><Text style={type.title}>{route.title}</Text>
    <Text style={type.body}>About {route.route.distanceM} m · {route.route.durationMinutes} min</Text>
    <View style={form.row}>{[...route.purposeTags, ...route.accessibilityTags].map(t => <RouteReasonBadge key={t} label={t}/>)}</View>
    <VerificationBadge level={route.verificationLevel}/><Text style={type.caption}>{route.lastWalkedAt ? `Last walked ${route.lastWalkedAt}` : 'Last walked date unknown'}</Text>
    <SecondaryButton label="View route" accessibilityHint={route.title} onPress={onOpen}/>
  </View>;
}

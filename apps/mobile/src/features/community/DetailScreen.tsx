import { ExpandableText } from '../../components/ExpandableText';
import { contentReportRepository, contentReportReasons, type ContentReportReason, type ContentReportRepository } from './contentReports';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { Choice, ErrorText, FormPage, form } from '../../components/Forms';
import { PhotoPreview } from '../../components/LocalPhoto';
import { RouteReasonBadge } from '../planner/RouteBadges';
import { type } from '../../theme/tokens';
import { communityRepository } from './repository';
import { SharedMap, VerificationBadge } from './components';
import type { CommunityRoute, CommunityRouteRepository } from './types';
export function DetailScreen({ id, repository = communityRepository, contentRepository = contentReportRepository }: { id: string; repository?: CommunityRouteRepository; contentRepository?: ContentReportRepository }) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState<ContentReportReason>('Incorrect route information');
  const [flagStatus, setFlagStatus] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  async function flag() { setFlagStatus('busy'); try { await contentRepository.create(id, reason); setFlagStatus('saved'); } catch { setFlagStatus('error'); } }
  const [route, setRoute] = useState<CommunityRoute | null>(null); const [status, setStatus] = useState('loading'); const [attempt, setAttempt] = useState(0);
  useEffect(() => { let active = true;
    repository.getRoute(id).then(r => { if (active) { setRoute(r); setStatus('ready'); } }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [id, repository, attempt]);
  return <FormPage title="Shared route"><SecondaryButton label="Back to Community" onPress={() => router.replace('/community')}/>
    {status === 'loading' ? <Text style={type.body}>Loading route…</Text> : status === 'error' ? <><ErrorText text="Couldn't load this route."/><SecondaryButton label="Retry" onPress={() => setAttempt(n => n + 1)}/></> : !route ? <Text style={type.body}>This route is unavailable. Browse another route in Community.</Text> : <>
      <Text accessibilityRole="header" style={type.heading}>{route.title}</Text><Text style={type.caption}>{route.author}</Text>
      <VerificationBadge level={route.verificationLevel}/><Text style={type.caption}>Community information, not an accessibility or safety guarantee.</Text>
      <Text style={type.body}>About {route.route.distanceM} m · {route.route.durationMinutes} min</Text>
      <SharedMap route={route.route}/><ExpandableText text={route.notes || 'No notes added.'}/>
      <View style={form.row}>{[...route.purposeTags, ...route.accessibilityTags].map(t => <RouteReasonBadge key={t} label={t}/>)}</View>
      <Text style={type.title}>Warnings</Text>{route.routeWarnings.length ? route.routeWarnings.map(w => <Text key={w} style={type.body}>{w}</Text>) : <Text style={type.body}>No warnings submitted. Conditions have not been independently checked.</Text>}
      <Text style={type.caption}>Last walked: {route.lastWalkedAt || 'Unknown'} · Submitted {new Date(route.createdAt).toLocaleDateString()}</Text>
      {route.photos.map(uri => <PhotoPreview key={uri} uri={uri}/>)}
      <Text style={type.caption}>Content flags are saved on this device only. Moderation and confirmations are not connected.</Text>
      {flagStatus === 'saved' ? <Text accessibilityLiveRegion="polite" style={type.body}>Content flag saved on this device. No moderation service is connected.</Text> : reporting ? <View style={form.group}>
        <Text style={type.title}>Report content</Text>{contentReportReasons.map(label => <Choice key={label} radio label={label} selected={reason === label} onPress={() => setReason(label)}/>)}
        {flagStatus === 'error' && <ErrorText text="Could not save the content flag. Try again."/>}
        <SecondaryButton label={flagStatus === 'busy' ? 'Saving flag…' : 'Save local content flag'} disabled={flagStatus === 'busy'} onPress={() => void flag()}/>
      </View> : <SecondaryButton label="Report content" onPress={() => setReporting(true)}/>}

    </>}
  </FormPage>;
}

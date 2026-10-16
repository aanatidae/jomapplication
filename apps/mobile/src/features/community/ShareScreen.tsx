import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Choice, ErrorText, Field, FormPage, form } from '../../components/Forms';
import { LocalPhoto } from '../../components/LocalPhoto';
import { type } from '../../theme/tokens';
import { getSharePath, seedPaths } from './data';
import { communityRepository, validateShare } from './repository';
import { TagChoices, VerificationBadge } from './components';
import { accessibilityTags, purposeTags, routeWarnings, type CommunityRoute, type CommunityRouteRepository, type CreateCommunityRouteInput } from './types';
export function ShareScreen({ repository = communityRepository, initialDraft }: { repository?: CommunityRouteRepository; initialDraft?: CreateCommunityRouteInput }) {
  const current = getSharePath();
  const paths = current ? [current, ...seedPaths] : seedPaths;
  const [draft, setDraft] = useState<CreateCommunityRouteInput>(initialDraft ?? { title: '', notes: '', purposeTags: [], accessibilityTags: [], routeWarnings: [], photos: [], route: current, lastWalkedAt: '' });
  const [errors, setErrors] = useState<Record<string, string>>({}); const [failure, setFailure] = useState('');
  const [created, setCreated] = useState<CommunityRoute | null>(null); const [busy, setBusy] = useState(false);
  function update(patch: Partial<CreateCommunityRouteInput>) { setDraft(v => ({ ...v, ...patch })); setErrors({}); }
  async function submit() {
    const validation = validateShare(draft); setErrors(validation); if (Object.keys(validation).length) return;
    setBusy(true); setFailure('');
    try { setCreated(await repository.createRoute(draft)); } catch { setFailure('Could not save the route. Your draft is still here. Try submitting again.'); } finally { setBusy(false); }
  }
  if (created) return <FormPage title="Route shared"><Text style={type.body}>{created.title}</Text><VerificationBadge level={created.verificationLevel}/>
    <Text style={type.body}>Saved on this device. Your route may require confirmation.</Text>
    <PrimaryButton label="View shared route" onPress={() => router.replace({ pathname: '/community-route', params: { id: created.id } })}/>
    <SecondaryButton label="Back to Community" onPress={() => router.replace('/community')}/></FormPage>;
  return <FormPage title="Share a route"><SecondaryButton label="Cancel sharing" disabled={busy} onPress={() => router.replace('/community')}/>
    <Text style={type.caption}>Share useful route knowledge. This demo saves on this device only.</Text>
    <Field label="Route title" value={draft.title} maxLength={100} error={errors.title} onChangeText={title => update({ title })}/>
    <Text style={type.title}>Choose a route</Text><Text style={type.caption}>Seeded options are illustrative. To share a planned route, start from Planner.</Text>
    {paths.map(path => <Choice key={path.id} radio label={`${path.label} · ${path.durationMinutes} min`} selected={draft.route?.id === path.id} onPress={() => update({ route: path })}/>)}
    {errors.route && <ErrorText text={errors.route}/>}
    <TagChoices title="Purpose" options={purposeTags} selected={draft.purposeTags} onChange={tags => update({ purposeTags: tags })}/>
    {errors.purpose && <ErrorText text={errors.purpose}/>}
    <Field label="Route notes" value={draft.notes} maxLength={2000} multiline error={errors.notes} onChangeText={notes => update({ notes })}/>
    <TagChoices title="Accessibility information" options={accessibilityTags} selected={draft.accessibilityTags} onChange={tags => update({ accessibilityTags: tags })}/>
    {errors.accessibility && <ErrorText text={errors.accessibility}/>}
    <TagChoices title="Route warnings" options={routeWarnings} selected={draft.routeWarnings} onChange={tags => update({ routeWarnings: tags })}/>
    {errors.warnings && <ErrorText text={errors.warnings}/>}
    <Field label="Last walked · optional · YYYY-MM-DD" value={draft.lastWalkedAt || ''} maxLength={10} placeholder="YYYY-MM-DD" error={errors.date} onChangeText={lastWalkedAt => update({ lastWalkedAt })}/>
    <LocalPhoto uri={draft.photos[0]} onChange={uri => update({ photos: uri ? [uri] : [] })}/>
    {errors.photos && <ErrorText text={errors.photos}/>}
    <View style={form.panel}><VerificationBadge level="community_submitted"/><Text style={type.caption}>New routes are never automatically verified.</Text></View>
    {failure ? <ErrorText text={failure}/> : null}
    <PrimaryButton label={busy ? 'Saving route…' : 'Submit route'} disabled={busy} onPress={() => void submit()}/>
  </FormPage>;
}

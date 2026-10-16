import { ExpandableText } from '../../components/ExpandableText';
import { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Choice, ErrorText, Field, FormPage, form } from '../../components/Forms';
import { LocalPhoto } from '../../components/LocalPhoto';
import { type } from '../../theme/tokens';
import type { SharedPath } from '../community/types';
import { SharedMap, VerificationBadge } from '../community/components';
import { barrierCategories, getReportRoute, routeLocations, type BarrierReport, type BarrierReportRepository, type ConditionType, type CreateBarrierReportInput } from './model';
import { barrierRepository, validateBarrier } from './repository';
import { ReportSummary } from './ReportSummary';
export function ReportScreen({ repository = barrierRepository, initialDraft, routeOverride }: { routeOverride?: SharedPath | null; repository?: BarrierReportRepository; initialDraft?: CreateBarrierReportInput }) {
  const route = routeOverride === undefined ? getReportRoute() : routeOverride; const locations = routeLocations(route);
  const [draft, setDraft] = useState<CreateBarrierReportInput>(initialDraft ?? { category: null, location: route ? locations[0] : null, description: '', conditionType: 'unknown' });
  const [step, setStep] = useState(0); const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState(''); const [busy, setBusy] = useState(false); const [created, setCreated] = useState<BarrierReport | null>(null);
  function update(patch: Partial<CreateBarrierReportInput>) { setDraft(v => ({ ...v, ...patch })); setErrors({}); }
  function next() {
    const all = validateBarrier(draft); const keys = step === 0 ? ['category'] : step === 1 ? ['location'] : ['description', 'condition', 'photo'];
    const relevant = Object.fromEntries(Object.entries(all).filter(([key]) => keys.includes(key))); setErrors(relevant);
    if (!Object.keys(relevant).length) setStep(n => n + 1);
  }
  async function submit() {
    const validation = validateBarrier(draft); setErrors(validation); if (Object.keys(validation).length) return;
    setBusy(true); setFailure(''); try { setCreated(await repository.createReport(draft)); } catch { setFailure('Could not save your report. Your details are still here. Retry submission.'); } finally { setBusy(false); }
  }
  if (created) return <FormPage title="Report submitted"><Text style={type.body}>Thanks for helping improve route information. This report is community submitted and may require confirmation.</Text>
    <ReportSummary report={created}/><PrimaryButton label="View local reports" onPress={() => router.replace('/barrier-reports')}/>
    <SecondaryButton label="Back to Planner" onPress={() => router.replace('/')}/></FormPage>;
  return <FormPage title={['What is the issue?', 'Where is it?', 'Add details', 'Review your report'][step]}>
    <Text style={type.caption}>Report barrier · Step {step + 1} of 4</Text>
    <SecondaryButton label="Cancel report" disabled={busy} onPress={() => router.replace('/')}/>
    {step === 0 && <View style={form.group}>{Object.entries(barrierCategories).map(([id, label]) => <Choice key={id} radio label={label} selected={draft.category === id} onPress={() => update({ category: id as keyof typeof barrierCategories })}/>)}{errors.category && <ErrorText text={errors.category}/>}</View>}
    {step === 1 && <><Text style={type.body}>Choose the closest point. These are schematic demo locations, not GPS coordinates.</Text>
      {route ? <SharedMap route={route}/> : <Text style={type.caption}>No active route or live location is available. You can associate this report with the labelled demo location.</Text>}
      {locations.map((location, index) => <Choice key={index} radio label={location.label} selected={draft.location?.label === location.label} onPress={() => update({ location })}/>)}
      {errors.location && <ErrorText text={errors.location}/>}</>}
    {step === 2 && <><Field label="Issue description" value={draft.description} maxLength={2000} multiline error={errors.description} onChangeText={description => update({ description })}/>
      <Text style={type.title}>How long might it last?</Text><View style={form.row}>{(['temporary', 'permanent', 'unknown'] as ConditionType[]).map(conditionType => <Choice key={conditionType} radio label={conditionType === 'unknown' ? 'Not sure' : conditionType === 'temporary' ? 'Temporary' : 'Permanent'} selected={draft.conditionType === conditionType} onPress={() => update({ conditionType })}/>)}</View>
      <Text style={type.caption}>Temporary reports need reconfirmation after 24 hours in this demo. Reports do not change routing automatically.</Text>
      <LocalPhoto uri={draft.photoUri} onChange={photoUri => update({ photoUri })}/>
      {errors.photo && <ErrorText text={errors.photo}/>}</>}
    {step === 3 && <View style={form.panel}><Text style={type.title}>{draft.category && barrierCategories[draft.category]}</Text>
      <Text style={type.body}>{draft.location?.label}</Text><Text style={type.caption}>Schematic demo location · not GPS</Text>
      <ExpandableText text={draft.description}/><Text style={type.body}>Condition: {draft.conditionType}</Text>
      <Text style={type.caption}>{draft.photoUri ? 'One local photo attached' : 'No photo attached'}</Text><VerificationBadge level="community_submitted"/>
      <Text style={type.caption}>Saved on this device only. This report may need confirmation.</Text></View>}
    {failure ? <ErrorText text={failure}/> : null}
    <PrimaryButton label={busy ? 'Submitting…' : step === 3 ? 'Submit report' : 'Continue'} disabled={busy} onPress={() => step === 3 ? void submit() : next()}/>
    {step > 0 && <SecondaryButton label="Back" disabled={busy} onPress={() => { setStep(n => n - 1); setErrors({}); }}/>}
  </FormPage>;
}

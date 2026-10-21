import { useState } from 'react';
import { Modal, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { Choice, Field, FormPage } from '../../components/Forms';
import { type } from '../../theme/tokens';
import { loadDemoCrossing, type DemoCrossing } from '../../services/routingApi';
import type { SharedPath } from '../community/types';
import { ReportsScreen } from './ReportsScreen';
import { ReportScreen } from './ReportScreen';
import type { BarrierReport } from './model';

export type DemoReport = { report: BarrierReport; crossing: DemoCrossing };

/** Demo reports stay in the mounted Planner, never in either report repository. */
export function BarrierModal({ route, pending, active, starting, onClose, onRecord, onActivate }: {
  route: SharedPath | null; pending?: DemoReport; active: boolean; starting: boolean;
  onClose: () => void; onRecord: (value: DemoReport) => void; onActivate: () => void;
}) {
  const [mode, setMode] = useState<'choose' | 'community' | 'reports' | 'demo'>('choose');
  const [crossing, setCrossing] = useState<DemoCrossing>();
  const [category, setCategory] = useState(false);
  const [located, setLocated] = useState(false);
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function prepare() {
    setBusy(true); setError('');
    try { setCrossing(await loadDemoCrossing()); setMode('demo'); }
    catch { setError('The supported crossing could not be checked. Start the backend and retry. No closure was activated.'); }
    finally { setBusy(false); }
  }
  function record() {
    if (!category || !located || !crossing) return;
    onRecord({ crossing, report: {
      id: `session-demo-${Date.now()}`, category: 'blocked_walkway',
      location: { label: crossing.label, coordinateSystem: 'WGS84', point: [crossing.longitude, crossing.latitude] },
      description: description.trim(), conditionType: 'temporary', reportedAt: new Date().toISOString(),
      verificationLevel: 'community_submitted',
    } });
  }
  return <Modal visible animationType="none" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1 }}>
    {mode === 'community' ? <ReportScreen routeOverride={route} onClose={onClose} onReports={() => setMode('reports')}/> :
      mode === 'reports' ? <ReportsScreen onClose={onClose}/> :
      <FormPage title={mode === 'demo' ? 'Crossing blockage demo' : 'Report Barrier'}>
        <SecondaryButton label="Return to map" onPress={onClose}/>
        {mode === 'choose' ? <>
          <Text style={type.body}>Community reports remain unverified and do not close routes automatically.</Text>
          <PrimaryButton label="Submit a community report" onPress={() => setMode('community')}/>
          <SecondaryButton label="View community reports" onPress={() => setMode('reports')}/>
          <Text style={type.title}>Hackathon simulation</Text>
          <Text style={type.body}>Record a session-only demo report, then explicitly simulate a crossing closure. Nothing is sent to the community database.</Text>
          <SecondaryButton label={busy ? 'Checking mapped crossing…' : 'Report a demo crossing blockage'} disabled={busy || active} onPress={() => void prepare()}/>
          {active && <Text style={type.caption}>A simulated closure is already active. Clear it on the map to repeat the demo.</Text>}
        </> : pending ? <>
          <Text accessibilityLiveRegion="polite" style={type.title}>Demo report recorded · unverified</Text>
          <Text style={type.body}>{pending.crossing.label}</Text>
          {!!pending.report.description && <Text style={type.body}>{pending.report.description}</Text>}
          <Text style={type.body}>This report has not changed routing. Activation below simulates a closure for this session only.</Text>
          <PrimaryButton label="Activate simulated closure" disabled={starting || active} onPress={onActivate}/>
        </> : <>
          <Text style={type.body}>Supported pilot location only. This is a simulation, not a verified real-world hazard.</Text>
          <Choice radio label="Blocked pedestrian crossing" selected={category} onPress={() => setCategory(true)}/>
          <Choice radio label={crossing?.label ?? 'Mapped crossing'} selected={located} onPress={() => setLocated(true)}/>
          <Text style={type.caption}>Both mapped crossing halves will be avoided. Signal-control details are unverified.</Text>
          <Field label="Description (optional)" value={description} onChangeText={setDescription} maxLength={2000} multiline/>
          <PrimaryButton label="Confirm demo report" disabled={!category || !located} onPress={record}/>
        </>}
        {!!error && <Text accessibilityRole="alert" style={type.body}>{error}</Text>}
      </FormPage>}
    </SafeAreaView>
  </Modal>;
}

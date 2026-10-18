import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { SecondaryButton } from '../../components/Buttons';
import { ErrorText, FormPage } from '../../components/Forms';
import { type } from '../../theme/tokens';
import { barrierRepository } from './repository';
import type { BarrierReport, BarrierReportRepository } from './model';
import { ReportSummary } from './ReportSummary';
import { persistenceDescription } from '../../services/persistenceMode';
export function ReportsScreen({ repository = barrierRepository }: { repository?: BarrierReportRepository }) {
  const [reports, setReports] = useState<BarrierReport[]>([]); const [status, setStatus] = useState('loading'); const [attempt, setAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(20);
  useEffect(() => { let active = true;
    repository.listReports().then(rows => { if (active) { setReports(rows); setStatus('ready'); } }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [repository, attempt]);
  return <FormPage title="Barrier reports"><SecondaryButton label="Back to Planner" onPress={() => router.replace('/')}/>
    <Text style={type.caption}>{persistenceDescription} These do not automatically alter routes. Expired reports need reconfirmation.</Text>
    {status === 'loading' ? <Text accessibilityLiveRegion="polite" style={type.body}>Loading reports…</Text> : status === 'error' ? <><ErrorText text="Couldn't load reports."/><SecondaryButton label="Retry" onPress={() => { setStatus('loading'); setAttempt(n => n + 1); }}/></> : reports.length ? reports.slice(0, visibleCount).map(report => <ReportSummary key={report.id} report={report}/>) : <Text style={type.body}>No reports yet. Start Report Barrier from Planner to add a route issue.</Text>}
    {reports.length > visibleCount && <SecondaryButton label="Show more" onPress={() => setVisibleCount(n => n + 20)}/>}
  </FormPage>;
}

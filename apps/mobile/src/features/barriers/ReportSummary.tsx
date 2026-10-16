import { ExpandableText } from '../../components/ExpandableText';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { form } from '../../components/Forms';
import { PhotoPreview } from '../../components/LocalPhoto';
import { type } from '../../theme/tokens';
import { VerificationBadge } from '../community/components';
import { barrierCategories, type BarrierReport } from './model';
export function ReportSummary({ report }: { report: BarrierReport }) {
  const [asOf] = useState(() => Date.now());
  const expired = report.expiresAt && Date.parse(report.expiresAt) <= asOf;
  return <View style={form.panel}><Text style={type.title}>{barrierCategories[report.category]}</Text>
    <VerificationBadge level={report.verificationLevel}/><ExpandableText text={report.description}/>
    <Text style={type.body}>{report.location.label}</Text><Text style={type.caption}>Schematic demo location · not GPS</Text>
    <Text style={type.body}>Condition: {report.conditionType}</Text>
    <Text style={type.caption}>Reported {new Date(report.reportedAt).toLocaleString()}</Text>
    {report.expiresAt && <Text style={type.caption}>{expired ? 'Expired · needs reconfirmation' : `Needs reconfirmation after ${new Date(report.expiresAt).toLocaleString()}`}</Text>}
    {report.photoUri && <PhotoPreview uri={report.photoUri}/>}
  </View>;
}

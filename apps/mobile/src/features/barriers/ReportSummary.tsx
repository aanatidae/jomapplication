import { ExpandableText } from '../../components/ExpandableText';
import { Text, View } from 'react-native';
import { form } from '../../components/Forms';
import { PhotoPreview } from '../../components/LocalPhoto';
import { type } from '../../theme/tokens';
import { VerificationBadge } from '../community/components';
import { barrierCategories, type BarrierReport } from './model';
import { FreshnessLabel, RouteWarningBanner, useQualityClock } from '../quality/components';
import { reportStatus } from '../quality/policy';
export function ReportSummary({ report }: { report: BarrierReport }) {
  const asOf = useQualityClock();
  return <View style={form.panel}><Text style={type.title}>{barrierCategories[report.category]}</Text>
    <VerificationBadge level={report.verificationLevel}/><ExpandableText text={report.description}/>
    <Text style={type.body}>{report.location.label}</Text><Text style={type.caption}>Schematic demo location · not GPS</Text>
    <Text style={type.body}>Condition: {report.conditionType}</Text>
    <RouteWarningBanner text={reportStatus(report, asOf)}/>
    <FreshnessLabel kind="Community reported" date={report.reportedAt} now={asOf}/>
    <FreshnessLabel kind="Verified" now={asOf}/>
    {report.expiresAt && Number.isFinite(Date.parse(report.expiresAt)) && <Text style={type.caption}>Reconfirmation due {new Date(report.expiresAt).toLocaleString()}</Text>}
    {report.photoUri && <PhotoPreview uri={report.photoUri}/>}
  </View>;
}

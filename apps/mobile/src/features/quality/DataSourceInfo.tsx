import { useState } from 'react';
import { Modal, Text } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { FormPage } from '../../components/Forms';
import { type } from '../../theme/tokens';
import type { MockRoute } from '../planner/mockRoutes';
import { AccessibilityStatus, FreshnessLabel, useQualityClock } from './components';

export function DataSourceInfo({ route }: { route: MockRoute }) {
  const [open, setOpen] = useState(false); const now = useQualityClock();
  const quality = route.dataQuality;
  return <>
    <SecondaryButton label="Route data details" accessibilityHint={route.mode} onPress={() => setOpen(true)}/>
    <Modal visible={open} animationType="none" onRequestClose={() => setOpen(false)} accessibilityViewIsModal>
      <FormPage title="Route data details">
        <SecondaryButton label="Close data details" onPress={() => setOpen(false)}/>
        <Text style={type.title}>{route.mode}</Text><Text style={type.body}>{route.confidence}</Text>
        <Text style={type.body}>Data confidence describes the quality of recorded information, not the probability of personal safety.</Text>
        <Text style={type.body}>Source: {quality?.sources.length ? quality.sources.join(', ') : 'Source information unavailable'}</Text>
        <Text style={type.caption}>{route.coordinateSystem === 'WGS84' ? 'OpenStreetMap community mapping. Safety and pedestrian accessibility coverage are incomplete; no field verification.' : 'Simulated pilot data. Not for real-world navigation.'}</Text>
        <FreshnessLabel kind="Verified" date={quality?.last_verified_at ?? undefined} now={now}/>
        <FreshnessLabel kind="Last updated" date={quality?.oldest_updated_at ?? undefined} now={now}/>
        <Text style={type.caption}>Oldest known segment update. Editing a record does not verify its conditions.</Text>
        {!!quality?.missing_update_count && <Text style={type.body}>Some segment update dates are unknown.</Text>}
        <AccessibilityStatus incomplete={quality?.accessibility_incomplete}/>
        {[...new Set([...(route.qualityFactors ?? []), ...(route.warnings ?? [])])].map((warning, index) => <Text key={index} style={type.body}>{warning}</Text>)}
      </FormPage>
    </Modal>
  </>;
}

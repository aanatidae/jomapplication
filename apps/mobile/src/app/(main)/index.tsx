import { useLocalSearchParams } from 'expo-router';
import { PlannerScreen } from '../../features/planner/PlannerScreen';
import { DemoPlannerScreen } from '../../features/planner/DemoPlannerScreen';
import { demoStates } from '../../features/planner/mockRoutes';

export default function PlannerRoute() {
  const params = useLocalSearchParams<{ demoState?: string; worstCase?: string; collapsed?: string }>();
  const state = __DEV__ ? demoStates.find(item => item.id === params.demoState)?.id ?? 'ready' : 'ready';
  const worstCase = __DEV__ && params.worstCase === '1';
  const expanded = !(__DEV__ && params.collapsed === '1');
  return __DEV__ && (params.demoState || params.worstCase || params.collapsed) ?
    <DemoPlannerScreen key={`${state}-${worstCase}-${expanded}`} initialState={state} initialWorstCase={worstCase} initialExpanded={expanded} /> : <PlannerScreen />;
}

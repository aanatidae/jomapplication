import { StyleSheet, Switch, Text, View } from 'react-native';
import { SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import { demoStates, type DemoState } from './mockRoutes';

export function DemoControls({ open, onToggle, state, onState, worstCase, onWorstCase }: {
  open: boolean; onToggle: () => void; state: DemoState; onState: (state: DemoState) => void; worstCase: boolean; onWorstCase: (value: boolean) => void;
}) {
  return <View style={styles.controls}>
    <SecondaryButton label={open ? 'Hide demo controls' : 'Demo controls'} accessibilityState={{ expanded: open }} onPress={onToggle} />
    {open && <>
      <Text style={type.title}>Prototype state preview</Text>
      <Text style={type.caption}>These controls simulate states locally. No services or permissions are used.</Text>
      <View style={styles.toggle}><Text style={[type.body, styles.grow]}>{worstCase ? 'Worst case' : 'Demo data'} · Long labels & many reasons</Text><Switch accessibilityLabel="Worst case data" value={worstCase} onValueChange={onWorstCase} trackColor={{ true: theme.color.accent, false: theme.color.outline }} /></View>
      {demoStates.map(item => <SecondaryButton key={item.id} label={`${state === item.id ? 'Selected · ' : ''}${item.label}`} accessibilityState={{ selected: state === item.id }} onPress={() => onState(item.id)} />)}
    </>}
  </View>;
}
const styles = StyleSheet.create({
  controls: { padding: theme.space.md, gap: theme.space.sm },
  toggle: { flexDirection: 'row', gap: theme.space.xs, alignItems: 'center', minHeight: theme.target }, grow: { flex: 1 },
});

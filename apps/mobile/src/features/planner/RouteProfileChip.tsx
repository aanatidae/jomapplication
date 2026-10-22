import { MotionPressable } from '../motion/Motion';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { theme, type } from '../../theme/tokens';
import type { MockRoute } from './mockRoutes';
import { selectionFeedback } from '../motion/haptics';

export function RouteProfileChip({ route, selected, onPress }: { route: Pick<MockRoute, 'mode'>; selected: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return <MotionPressable accessibilityRole="radio" accessibilityLabel={route.mode} accessibilityState={{ selected, checked: selected }}
    onPress={() => { if (!selected) selectionFeedback(); onPress(); }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.chip, selected && styles.selected, focused && styles.focus, pressed && styles.pressed]}>
    <Text style={[type.label, selected && styles.selectedLabel]}>{route.mode}</Text>
  </MotionPressable>;
}
const styles = StyleSheet.create({
  chip: { minHeight: theme.target, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: theme.space.sm, paddingVertical: theme.space.xs, borderRadius: theme.radius.pill, borderWidth: 2, borderColor: theme.color.divider, backgroundColor: theme.color.surface },
  selected: { backgroundColor: theme.color.accent, borderColor: theme.color.accent }, selectedLabel: { color: theme.color.onAccent },
  focus: { borderColor: theme.color.focus }, pressed: { opacity: 0.7 },
});

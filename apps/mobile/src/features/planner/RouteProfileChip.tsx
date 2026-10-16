import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { theme, type } from '../../theme/tokens';
import type { MockRoute } from './mockRoutes';

export function RouteProfileChip({ route, selected, onPress }: { route: Pick<MockRoute, 'mode'>; selected: boolean; onPress: () => void }) {
  const [focused, setFocused] = useState(false);
  return <Pressable accessibilityRole="radio" accessibilityLabel={route.mode} accessibilityState={{ selected, checked: selected }}
    onPress={onPress} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.chip, selected && styles.selected, focused && styles.focus, pressed && styles.pressed]}>
    <Text style={[type.label, selected && styles.selectedLabel]}>{selected ? 'Selected · ' : ''}{route.mode}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  chip: { minHeight: theme.target, maxWidth: '100%', justifyContent: 'center', padding: theme.space.sm, borderRadius: theme.radius.md, borderWidth: 2, borderColor: theme.color.outline },
  selected: { backgroundColor: theme.color.accent, borderColor: theme.color.accent }, selectedLabel: { color: theme.color.onAccent },
  focus: { borderColor: theme.color.focus }, pressed: { opacity: 0.7 },
});

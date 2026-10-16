import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { theme, type } from '../theme/tokens';

type ButtonProps = Pick<PressableProps, 'onPress' | 'disabled' | 'accessibilityHint' | 'accessibilityState'> & {
  label: string; variant?: 'primary' | 'secondary'; closeIcon?: boolean;
};

function Button({ label, variant = 'primary', disabled, closeIcon, ...props }: ButtonProps) {
  const [focused, setFocused] = useState(false);
  return <Pressable {...props} disabled={disabled} accessibilityRole="button"
    accessibilityLabel={label} accessibilityState={{ ...props.accessibilityState, disabled: !!disabled }}
    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
    style={({ pressed }) => [styles.button, variant === 'primary' ? styles.primary : styles.secondary,
      pressed && styles.pressed, disabled && styles.disabled, focused && styles.focus]}>
    {closeIcon && <View accessible={false} style={styles.icon}><View style={[styles.stroke, styles.slash]} /><View style={[styles.stroke, styles.backslash]} /></View>}
    <Text style={[type.body, styles.label, variant === 'primary' && styles.primaryLabel, disabled && styles.disabledLabel]}>{label}</Text>
  </Pressable>;
}
export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) { return <Button {...props} />; }
export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) { return <Button {...props} variant="secondary" />; }

// An authored geometric icon rather than a font glyph; its action always has a label.
export function IconButton({ label, onPress }: Pick<ButtonProps, 'label' | 'onPress'>) {
  return <Button label={label} onPress={onPress} variant="secondary" closeIcon />;
}
const styles = StyleSheet.create({
  button: { minWidth: theme.target, minHeight: theme.target, paddingHorizontal: theme.space.md, paddingVertical: theme.space.sm, borderRadius: theme.radius.md, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: theme.space.xs, borderWidth: 2, borderColor: 'transparent' },
  primary: { backgroundColor: theme.color.accent }, secondary: { backgroundColor: theme.color.raised },
  label: { fontWeight: '600', textAlign: 'center', flexShrink: 1 }, primaryLabel: { color: theme.color.onAccent },
  pressed: { opacity: 0.7 }, disabled: { backgroundColor: theme.color.disabled }, disabledLabel: { color: theme.color.onDisabled },
  focus: { borderColor: theme.color.focus },
  icon: { width: theme.icon.md, height: theme.icon.md, flexShrink: 0, justifyContent: 'center' },
  stroke: { position: 'absolute', width: theme.icon.md, height: 2, backgroundColor: theme.color.ink },
  slash: { transform: [{ rotate: '45deg' }] }, backslash: { transform: [{ rotate: '-45deg' }] },
});

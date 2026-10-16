import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { theme, type } from '../theme/tokens';

export function FormPage({ title, children }: { title: string; children: ReactNode }) {
  return <KeyboardAvoidingView style={form.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView key={title} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={form.content}>
      <Text accessibilityRole="header" style={type.heading}>{title}</Text>{children}
    </ScrollView>
  </KeyboardAvoidingView>;
}
export function Choice({ label, selected, onPress, radio = false }: { label: string; selected: boolean; onPress: () => void; radio?: boolean }) {
  const [focused, setFocused] = useState(false);
  return <Pressable onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} accessibilityRole={radio ? 'radio' : 'checkbox'} accessibilityLabel={label}
    accessibilityState={{ checked: selected }} onPress={onPress}
    style={({ pressed }) => [form.choice, selected && form.selected, pressed && { opacity: 0.7 }, focused && { borderColor: theme.color.focus }]}>
    <Text style={type.body}>{selected ? 'Selected · ' : ''}{label}</Text>
  </Pressable>;
}
export function Field({ label, value, onChangeText, maxLength, multiline, error, placeholder }: {
  label: string; value: string; onChangeText: (text: string) => void; maxLength: number; multiline?: boolean; error?: string; placeholder?: string;
}) {
  return <View style={form.group}><Text style={type.label}>{label}</Text>
    <TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} maxLength={maxLength}
      multiline={multiline} placeholder={placeholder} placeholderTextColor={theme.color.muted}
      style={[form.input, multiline && { minHeight: theme.target * 2, maxHeight: theme.target * 4, textAlignVertical: 'top' }]}/>
    {error && <ErrorText text={error} />}
    <Text style={type.caption}>{value.length}/{maxLength}</Text>
  </View>;
}
export function ErrorText({ text }: { text: string }) { return <Text accessibilityRole="alert" style={[type.body, { color: theme.color.error }]}>{text}</Text>; }
export const form = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.background },
  content: { width: '100%', maxWidth: theme.layout.contentMax, alignSelf: 'center', padding: theme.space.md, gap: theme.space.md, paddingBottom: theme.space.xxl },
  group: { gap: theme.space.xs }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.xs },
  choice: { minHeight: theme.target, minWidth: theme.target, borderWidth: 2, borderColor: theme.color.outline, borderRadius: theme.radius.md, padding: theme.space.sm, justifyContent: 'center', flexShrink: 1 },
  selected: { borderColor: theme.color.accent, backgroundColor: theme.color.selected },
  input: { ...type.body, minHeight: theme.target, borderWidth: 2, borderColor: theme.color.outline, backgroundColor: theme.color.surface, borderRadius: theme.radius.md, padding: theme.space.sm },
  panel: { gap: theme.space.sm, padding: theme.space.md, backgroundColor: theme.color.surface, borderRadius: theme.radius.lg },
});

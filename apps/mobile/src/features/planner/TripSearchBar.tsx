import { useState } from 'react';
import { Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { MotionPressable } from '../motion/Motion';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import { places } from './mockRoutes';

type Props = {
  origin: string; destination: string;
  onChange: (field: 'origin' | 'destination', value: string) => void;
  availablePlaces?: readonly string[]; requestedField?: 'origin' | null; onClose?: () => void; geographic?: boolean;
  compact?: boolean;
  originLabel?: string;
};
export function TripSearchBar({ origin, destination, onChange, requestedField, onClose, availablePlaces = places, geographic = false, compact, originLabel }: Props) {
  const [editing, setEditing] = useState<'origin' | 'destination' | null>(null);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const { fontScale } = useWindowDimensions();
  const activeField = requestedField ?? editing;
  function closePicker() { Keyboard.dismiss(); setEditing(null); setQuery(''); onClose?.(); }
  function choose(value: string) { if (activeField) onChange(activeField, value); closePicker(); }
  const matches = availablePlaces.filter(p => p.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={styles.trip}>
    {!compact && <Text style={type.caption}>Same trip. A route for your needs.</Text>}
    {compact ? <View style={styles.fields}>
      {(['origin', 'destination'] as const).map(field => <MotionPressable key={field}
        accessibilityRole="button" accessibilityLabel={`${field === 'origin' ? 'From' : 'To'} · ${field === 'origin' ? originLabel ? `${originLabel} · ${origin}` : origin : destination}`}
        accessibilityHint="Choose a mapped place" onPress={() => { setQuery(''); setEditing(field); }}
        onFocus={() => setFocused(field)} onBlur={() => setFocused(null)}
        style={({ pressed }) => [styles.place, field === 'destination' && styles.destination, (pressed || focused === field) && styles.pressed]}>
        <View accessible={false} style={[styles.marker, field === 'destination' && styles.destinationMarker]} />
        <Text style={styles.fieldLabel}>{field === 'origin' ? 'From' : 'To'}</Text>
        <Text numberOfLines={fontScale > 1.5 ? undefined : 1} style={styles.placeName}>{field === 'origin' ? originLabel ?? origin : destination}</Text>
        <Text accessible={false} style={styles.chevron}>›</Text>
      </MotionPressable>)}
    </View> : <View style={styles.fields}>
      <View style={compact && styles.flex}><SecondaryButton label={`From · ${origin}`} onPress={() => { setQuery(''); setEditing('origin'); }} /></View>
      <View style={compact && styles.flex}><SecondaryButton label={`To · ${destination}`} onPress={() => { setQuery(''); setEditing('destination'); }} /></View>
    </View>}
    <Modal visible={activeField !== null} animationType="none" onRequestClose={closePicker}>
      <SafeAreaView style={styles.modal}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.picker}>
            <Text accessibilityRole="header" style={type.heading}>Choose {activeField}</Text>
            <Text style={type.caption}>{geographic ? 'Mapped Brickfields landmarks · You can also select a point on the map.' : 'Local demo places only'}</Text>
            <View style={styles.currentSelection}><Text style={type.label}>Currently selected</Text><Text selectable style={type.body}>{activeField === 'origin' ? origin : destination}</Text></View>
            <TextInput accessibilityLabel={geographic ? 'Search Brickfields places' : 'Search demo places'} placeholder={geographic ? 'Search Brickfields places' : 'Search demo places'} placeholderTextColor={theme.color.muted} selectionColor={theme.color.accent}
              style={styles.input} value={query} onChangeText={setQuery} returnKeyType="search" autoCorrect={false} />
            {matches.map(place => <PrimaryButton key={place} label={place} onPress={() => choose(place)} />)}
            {matches.length === 0 && <Text style={type.body}>{geographic ? 'No matching landmarks. Clear the search or select a point on the map.' : 'No matching demo places. Clear your search to see all places.'}</Text>}
            <IconButton label="Cancel" onPress={closePicker} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  trip: { paddingHorizontal: theme.space.sm, paddingBottom: theme.space.xs, gap: theme.space.xs, backgroundColor: theme.color.surface },
  fields: { gap: theme.space.xxs },
  place: { minHeight: theme.target, flexDirection: 'row', alignItems: 'center', gap: theme.space.sm, paddingHorizontal: theme.space.xs, borderRadius: theme.radius.sm, borderWidth: 2, borderColor: 'transparent' },
  destination: { backgroundColor: theme.color.selected, borderRadius: theme.radius.md },
  marker: { width: 12, height: 12, flexShrink: 0, borderRadius: 6, borderWidth: 3, borderColor: theme.color.accent },
  destinationMarker: { borderRadius: 3, backgroundColor: theme.color.accent },
  fieldLabel: { ...type.caption, width: 38 },
  placeName: { ...type.body, fontWeight: '600', flex: 1 },
  chevron: { ...type.title, color: theme.color.accent },
  pressed: { borderColor: theme.color.focus },
  modal: { flex: 1, backgroundColor: theme.color.background }, flex: { flex: 1 },
  picker: { padding: theme.space.lg, gap: theme.space.md },
  currentSelection: { padding: theme.space.md, gap: theme.space.xxs, backgroundColor: theme.color.surface, borderRadius: theme.radius.lg, borderWidth: 1, borderColor: theme.color.divider },
  input: { ...type.body, minHeight: theme.target, padding: theme.space.sm, borderWidth: 2, borderColor: theme.color.accent, borderRadius: theme.radius.md, backgroundColor: theme.color.surface },
});

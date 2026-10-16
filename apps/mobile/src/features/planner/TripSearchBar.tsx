import { useState } from 'react';
import { Keyboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconButton, PrimaryButton, SecondaryButton } from '../../components/Buttons';
import { theme, type } from '../../theme/tokens';
import { places } from './mockRoutes';

type Props = {
  origin: string; destination: string;
  onChange: (field: 'origin' | 'destination', value: string) => void;
  availablePlaces?: readonly string[]; requestedField?: 'origin' | null; onClose?: () => void;
};
export function TripSearchBar({ origin, destination, onChange, requestedField, onClose, availablePlaces = places }: Props) {
  const [editing, setEditing] = useState<'origin' | 'destination' | null>(null);
  const [query, setQuery] = useState('');
  const activeField = requestedField ?? editing;
  function closePicker() { Keyboard.dismiss(); setEditing(null); setQuery(''); onClose?.(); }
  function choose(value: string) { if (activeField) onChange(activeField, value); closePicker(); }
  const matches = availablePlaces.filter(p => p.toLowerCase().includes(query.trim().toLowerCase()));
  return <View style={styles.trip}>
    <Text style={type.caption}>Same trip. A route for your needs.</Text>
    <SecondaryButton label={`From · ${origin}`} onPress={() => { setQuery(''); setEditing('origin'); }} />
    <SecondaryButton label={`To · ${destination}`} onPress={() => { setQuery(''); setEditing('destination'); }} />
    <Modal visible={activeField !== null} animationType="none" onRequestClose={closePicker}>
      <SafeAreaView style={styles.modal}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.picker}>
            <Text accessibilityRole="header" style={type.heading}>Choose {activeField}</Text>
            <Text style={type.caption}>Local demo places only</Text>
            <TextInput accessibilityLabel="Search demo places" placeholder="Search demo places" placeholderTextColor={theme.color.muted} selectionColor={theme.color.accent}
              style={styles.input} value={query} onChangeText={setQuery} returnKeyType="search" autoCorrect={false} />
            {matches.map(place => <PrimaryButton key={place} label={place} onPress={() => choose(place)} />)}
            {matches.length === 0 && <Text style={type.body}>No matching demo places. Clear your search to see all places.</Text>}
            <IconButton label="Cancel" onPress={closePicker} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  trip: { paddingHorizontal: theme.space.md, paddingBottom: theme.space.md, gap: theme.space.xs, backgroundColor: theme.color.surface },
  modal: { flex: 1, backgroundColor: theme.color.background }, flex: { flex: 1 },
  picker: { padding: theme.space.lg, gap: theme.space.md },
  input: { ...type.body, minHeight: theme.target, padding: theme.space.sm, borderWidth: 2, borderColor: theme.color.accent, borderRadius: theme.radius.md, backgroundColor: theme.color.surface },
});

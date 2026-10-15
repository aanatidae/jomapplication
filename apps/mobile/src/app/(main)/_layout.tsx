import { router, Slot, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const destinations = [
  { href: '/', label: 'Planner' },
  { href: '/community', label: 'Community' },
  { href: '/profile', label: 'Profile' },
] as const;

export default function MainLayout() {
  const pathname = usePathname();
  const { width, fontScale } = useWindowDimensions();
  const stackNavigation = width / fontScale < 280;
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}><Slot /></View>
      <View
        accessibilityRole="tablist"
        style={[styles.navigation, stackNavigation && styles.stackedNavigation]}
      >
        {destinations.map(({ href, label }) => (
            <Pressable
              key={href}
              onPress={() => router.replace(href)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: pathname === href }}
              style={({ pressed }) => [
                styles.tab,
                stackNavigation && styles.stackedTab,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.selection}>{pathname === href ? 'Selected' : ''}</Text>
            </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

// Temporary shell layout only. Phase 2 will establish the visual system.
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  content: { flex: 1 },
  navigation: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#767676' },
  stackedNavigation: { flexDirection: 'column' },
  tab: { flex: 1, minHeight: 64, padding: 8, justifyContent: 'center', alignItems: 'center' },
  stackedTab: { flex: 0 },
  pressed: { backgroundColor: '#e5e5e5' },
  label: { fontSize: 16, color: '#171717', textAlign: 'center' },
  selection: { fontSize: 12, color: '#333333', textAlign: 'center' },
});

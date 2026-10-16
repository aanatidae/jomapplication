import { router, Slot, usePathname } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, type } from '../../theme/tokens';

const destinations = [
  { href: '/', label: 'Planner' },
  { href: '/community', label: 'Community' },
  { href: '/profile', label: 'Profile' },
] as const;

export default function MainLayout() {
  const pathname = usePathname();
  const [focusedTab, setFocusedTab] = useState<string | null>(null);
  const { width, fontScale } = useWindowDimensions();
  const stackNavigation = width / fontScale < 180;
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
              onFocus={() => setFocusedTab(href)}
              onBlur={() => setFocusedTab(null)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: pathname === href }}
              style={({ pressed }) => [
                styles.tab,
                pathname === href && styles.active,
                focusedTab === href && styles.focused,
                stackNavigation && styles.stackedTab,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.label}>{label}</Text>
              {pathname === href && <View accessibilityElementsHidden style={styles.indicator} />}
            </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.color.background },
  content: { flex: 1 },
  navigation: { flexDirection: 'row', backgroundColor: theme.color.surface, borderTopWidth: 1, borderTopColor: theme.color.outline },
  stackedNavigation: { flexDirection: 'column' },
  tab: { flex: 1, minHeight: theme.target, padding: theme.space.xs, justifyContent: 'center', alignItems: 'center', gap: theme.space.xxs, borderWidth: 2, borderColor: 'transparent' },
  focused: { borderColor: theme.color.focus },
  stackedTab: { flex: 0 },
  pressed: { backgroundColor: theme.color.raised }, active: { backgroundColor: theme.color.selected },
  label: { ...type.label, textAlign: 'center' },
  indicator: { height: theme.space.xxs, width: theme.space.lg, borderRadius: theme.radius.pill, backgroundColor: theme.color.accent },
});

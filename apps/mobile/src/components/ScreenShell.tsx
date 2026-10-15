import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

type ScreenShellProps = PropsWithChildren<{ title: string; description: string }>;

export function ScreenShell({ title, description, children }: ScreenShellProps) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: '600', color: '#171717' },
  description: { fontSize: 18, color: '#333333' },
});

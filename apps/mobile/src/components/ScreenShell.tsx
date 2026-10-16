import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { theme, type } from '../theme/tokens';

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
  content: { padding: theme.space.lg, gap: theme.space.md },
  title: type.heading,
  description: type.body,
});

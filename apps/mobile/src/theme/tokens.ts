import { StyleSheet } from 'react-native';

// Native Text retains system scaling. Light-only in Phase 2; never invert map semantics.
export const theme = {
  color: {
    background: '#F5F5EF', surface: '#FFFFFF', raised: '#EBEEE7',
    ink: '#172F2C', muted: '#52635D', accent: '#006653', onAccent: '#FFFFFF',
    selected: '#E4F1E9', outline: '#7C8B82', focus: '#163FAD',
    safety: '#685016', safetySurface: '#FAF0CE', accessibility: '#234D78',
    accessibilitySurface: '#E8EFF8', verified: '#006653', success: '#21633D',
    warning: '#795215', error: '#A02C2C', errorSurface: '#FBEDEC',
    disabled: '#E2E6DF', onDisabled: '#59645D',
    map: '#E8ECE2', park: '#CFDDC4', block: '#DCE1D6', road: '#FFFFFF',
    alternateRoute: '#6A7974', routeHalo: '#FFFFFF', water: '#CFDFE4',
  },
  space: { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, sheet: 24, pill: 999 },
  icon: { sm: 16, md: 24, lg: 32 },
  target: 48,
  layout: { contentMax: 720, mapHeight: 320, mapCompactHeight: 260 },
  // No authored movement or looping skeletons: all state changes are immediate,
  // including when the OS requests reduced motion. Motion polish belongs to Phase 11.
  motion: { duration: 0 },
  elevation: { sheet: { shadowColor: '#172F2C', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 } },
} as const;

export const type = StyleSheet.create({
  display: { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8, color: theme.color.ink },
  heading: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.4, color: theme.color.ink },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '600', color: theme.color.ink },
  body: { fontSize: 16, lineHeight: 23, color: theme.color.ink },
  caption: { fontSize: 14, lineHeight: 20, color: theme.color.muted },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600', color: theme.color.ink },
});

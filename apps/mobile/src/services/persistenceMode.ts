// Local mode is an explicit presentation fallback, never a network-error fallback.
export const isLocalDemo = process.env.EXPO_PUBLIC_DATA_MODE === 'local';
export const persistenceDescription = isLocalDemo
  ? 'Local demo · saved on this device only.'
  : 'Community contributions · saved online. Conditions can change.';

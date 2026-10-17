export function appError(operation: string, error: unknown): Error {
  // Do not log payloads, tokens, URLs or raw database messages.
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : 'unavailable';
  if (__DEV__) console.info(`Persistence ${operation} failed (${code}).`);
  return new Error(`Couldn't ${operation}. Please try again.`);
}

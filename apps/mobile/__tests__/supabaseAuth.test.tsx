import { Text } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AuthGate } from '../src/services/supabase/AuthGate';
import { getSupabase } from '../src/services/supabase/client';
jest.mock('../src/services/persistenceMode', () => ({ isLocalDemo: false }));
jest.mock('../src/services/supabase/client', () => ({ getSupabase: jest.fn() }));
test('auth gate renders loading, signed out, guest progress and signed-in content', async () => {
  let restore: (v: unknown) => void = () => {};
  let finishSignIn: (v: unknown) => void = () => {};
  const client = { auth: { getSession: jest.fn(() => new Promise(resolve => { restore = resolve; })), onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })), startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn(), signInAnonymously: jest.fn(() => new Promise(resolve => { finishSignIn = resolve; })) } };
  jest.mocked(getSupabase).mockReturnValue(client as unknown as ReturnType<typeof getSupabase>);
  render(<AuthGate><Text>Private app content</Text></AuthGate>);
  expect(screen.getByText('Restoring your guest session…')).toBeTruthy();
  await waitFor(() => expect(client.auth.getSession).toHaveBeenCalled());
  await act(async () => restore({ data: { session: null }, error: null }));
  expect(screen.queryByText('Private app content')).toBeNull();
  fireEvent.press(screen.getByRole('button', { name: 'Continue as guest' }));
  expect(screen.getByRole('button', { name: 'Starting guest session…' }).props.accessibilityState.disabled).toBe(true);
  await act(async () => finishSignIn({ data: { session: { user: { id: 'u1' } } }, error: null }));
  expect(screen.getByText('Private app content')).toBeTruthy();
});
test('missing configuration shows recoverable error without exposing provider messages', async () => {
  jest.mocked(getSupabase).mockImplementation(() => { throw new Error('provider internal detail'); });
  render(<AuthGate><Text>Private app content</Text></AuthGate>);
  await screen.findByText("Couldn't connect your guest session. Check your connection and project configuration, then retry.");
  expect(screen.getByRole('button', { name: 'Retry connection' })).toBeTruthy();
  expect(screen.queryByText('provider internal detail')).toBeNull();
  expect(screen.queryByText('Private app content')).toBeNull();
});

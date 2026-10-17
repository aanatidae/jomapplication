import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import { appError } from './errors';

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in' | 'error';
export async function restoreIdentity(client: SupabaseClient<Database>) {
  const { data, error } = await client.auth.getSession();
  if (error) throw appError('restore your guest session', error);
  return data.session;
}
export async function signInGuest(client: SupabaseClient<Database>) {
  const { data, error } = await client.auth.signInAnonymously();
  if (error || !data.session) throw appError('start your guest session', error);
  return data.session;
}
export async function requireUser(client: SupabaseClient<Database>): Promise<string> {
  const session = await restoreIdentity(client);
  if (!session) throw new Error('Start a guest session to continue.');
  return session.user.id;
}

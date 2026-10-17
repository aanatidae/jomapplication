import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';

let client: SupabaseClient<Database> | undefined;
export function getSupabase(): SupabaseClient<Database> {
  if (client) return client;
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  if (key.startsWith('sb_secret_')) throw new Error('Use a public Supabase key.');
  // Legacy keys are JWTs. Reject anything except the public anon role.
  if (!key.startsWith('sb_publishable_')) {
    try {
      const payload = JSON.parse(globalThis.atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))) as { role?: string };
      if (payload.role !== 'anon') throw new Error('Invalid role');
    } catch { throw new Error('Use a public Supabase anon or publishable key.'); }
  }
  client = createClient<Database>(url, key, {
    auth: { storage: AsyncStorage, storageKey: 'jom.supabase.auth.v1', persistSession: true,
      autoRefreshToken: true, detectSessionInUrl: false },
  });
  return client;
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import { appError } from './errors';
import type { SupabaseImages } from './images';

export async function cleanupSubmission(client: SupabaseClient<Database>, images: SupabaseImages,
  table: 'community_routes' | 'barrier_reports', id?: string, path?: string) {
  // Remove the row first. If publication succeeded but its response was lost,
  // removing the image before the row could leave a visible broken reference.
  let rowRemoved = !id;
  if (id) {
    try {
      const result = await client.from(table).delete().eq('id', id);
      if (result.error) appError('clean up the submission', result.error);
      else rowRemoved = true;
    } catch (error) { appError('clean up the submission', error); }
  }
  if (path && rowRemoved) {
    await images.remove(path).catch(error => { appError('clean up the photo', error); });
  }
}

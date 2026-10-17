import { File } from 'expo-file-system';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/database.types';
import { appError } from './errors';

export const IMAGE_BUCKET = 'jom-community-images';
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export type PreparedImage = { bytes: Uint8Array; mime: string; extension: string };
export function validateImage(bytes: Uint8Array): PreparedImage {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error('Choose an image smaller than 10 MB.');
  const is = (...values: number[]) => values.every((v, i) => bytes[i] === v);
  if (is(0xff, 0xd8, 0xff)) return { bytes, mime: 'image/jpeg', extension: 'jpg' };
  if (is(0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10)) return { bytes, mime: 'image/png', extension: 'png' };
  if (is(82, 73, 70, 70) && bytes[8] === 87 && bytes[9] === 69 && bytes[10] === 66 && bytes[11] === 80) return { bytes, mime: 'image/webp', extension: 'webp' };
  throw new Error('Choose a JPEG, PNG or WebP image.');
}
export async function prepareImage(uri: string): Promise<PreparedImage> {
  try {
    if (!/^(file|content):\/\//.test(uri)) throw new Error('Invalid image URI');
    const file = new File(uri);
    if (file.size > MAX_IMAGE_BYTES) throw new Error('Image too large');
    return validateImage(await file.bytes());
  } catch (error) { throw appError('read the photo; choose a JPEG, PNG or WebP under 10 MB', error); }
}
export class SupabaseImages {
  constructor(private client: SupabaseClient<Database>) {}
  prepare = prepareImage;
  publicUrl(path: string) { return this.client.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl; }
  async upload(path: string, image: PreparedImage) {
    // React Native upload uses ArrayBuffer, not Blob/FormData.
    const body = new Uint8Array(image.bytes).buffer;
    const { error } = await this.client.storage.from(IMAGE_BUCKET).upload(path, body, { contentType: image.mime, upsert: false });
    if (error) throw appError('upload the photo', error);
    return path;
  }
  async remove(path: string) {
    const { error } = await this.client.storage.from(IMAGE_BUCKET).remove([path]);
    if (error) throw appError('remove the photo', error);
  }
}

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommunityRoute, CommunityRouteRepository, CreateCommunityRouteInput } from '../../features/community/types';
import { validateShare } from '../../features/community/localRepository';
import type { CommunityRow, Database } from '../../types/database.types';
import { requireUser } from './auth';
import { appError } from './errors';
import { SupabaseImages } from './images';
import { cleanupSubmission } from './cleanup';

export function mapCommunity(row: CommunityRow, images: Pick<SupabaseImages, 'publicUrl'>): CommunityRoute {
  return { id: row.id, author: 'Community contributor', title: row.title, notes: row.notes,
    purposeTags: row.purpose_tags, route: row.route, accessibilityTags: row.accessibility_tags,
    routeWarnings: row.warnings, photos: row.photo_path ? [images.publicUrl(row.photo_path)] : [],
    ...(row.last_walked_at ? { lastWalkedAt: row.last_walked_at } : {}),
    createdAt: row.created_at, verificationLevel: row.verification_level };
}
export class SupabaseCommunityRouteRepository implements CommunityRouteRepository {
  constructor(private client: SupabaseClient<Database>, private images = new SupabaseImages(client)) {}
  async listRoutes(): Promise<CommunityRoute[]> {
    try {
      const { data, error } = await this.client.from('community_routes').select('*').eq('published', true).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map(row => mapCommunity(row, this.images));
    } catch (error) { throw appError('load shared routes', error); }
  }
  async getRoute(id: string): Promise<CommunityRoute | null> {
    try {
      const { data, error } = await this.client.from('community_routes').select('*').eq('id', id).eq('published', true).maybeSingle();
      if (error) throw error;
      return data ? mapCommunity(data, this.images) : null;
    } catch (error) { throw appError('load the route', error); }
  }
  async createRoute(input: CreateCommunityRouteInput): Promise<CommunityRoute> {
    let id: string | undefined; let path: string | undefined;
    try {
      if (Object.keys(validateShare(input)).length || !input.route) throw new Error('Invalid route');
      const userId = await requireUser(this.client);
      const image = input.photos[0] ? await this.images.prepare(input.photos[0]) : undefined;
      const { data, error } = await this.client.from('community_routes').insert({
        user_id: userId, title: input.title.trim(), notes: input.notes.trim(), purpose_tags: input.purposeTags,
        route: input.route, accessibility_tags: input.accessibilityTags, warnings: input.routeWarnings,
        last_walked_at: input.lastWalkedAt || null, verification_level: 'community_submitted', published: !image,
      }).select('*').single();
      if (error || !data) throw error;
      id = data.id;
      if (!image) return mapCommunity(data, this.images);
      path = `community-routes/${userId}/${id}/photo.${image.extension}`;
      await this.images.upload(path, image);
      const result = await this.client.from('community_routes').update({ photo_path: path, published: true }).eq('id', id).eq('user_id', userId).select('*').single();
      if (result.error || !result.data) throw result.error;
      return mapCommunity(result.data, this.images);
    } catch (error) {
      await cleanupSubmission(this.client, this.images, 'community_routes', id, path);
      throw appError('publish your route; your draft is still available', error);
    }
  }
}

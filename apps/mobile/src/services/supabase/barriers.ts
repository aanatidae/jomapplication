import type { SupabaseClient } from '@supabase/supabase-js';
import type { BarrierReport, BarrierReportRepository, CreateBarrierReportInput } from '../../features/barriers/model';
import { validateBarrier } from '../../features/barriers/localRepository';
import type { BarrierRow, Database } from '../../types/database.types';
import { requireUser } from './auth';
import { appError } from './errors';
import { SupabaseImages } from './images';
import { cleanupSubmission } from './cleanup';

export function mapBarrier(row: BarrierRow, images: Pick<SupabaseImages, 'publicUrl'>): BarrierReport {
  return { id: row.id, category: row.category, location: row.location, description: row.description,
    conditionType: row.condition_type, reportedAt: row.reported_at, verificationLevel: row.verification_level,
    ...(row.expires_at ? { expiresAt: row.expires_at } : {}),
    ...(row.photo_path ? { photoUri: images.publicUrl(row.photo_path) } : {}) };
}
export class SupabaseBarrierReportRepository implements BarrierReportRepository {
  constructor(private client: SupabaseClient<Database>, private images = new SupabaseImages(client)) {}
  async listReports(): Promise<BarrierReport[]> {
    try {
      const { data, error } = await this.client.from('barrier_reports').select('*').eq('published', true).order('reported_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []).map(row => mapBarrier(row, this.images));
    } catch (error) { throw appError('load barrier reports', error); }
  }
  async createReport(input: CreateBarrierReportInput): Promise<BarrierReport> {
    let id: string | undefined; let path: string | undefined;
    try {
      if (Object.keys(validateBarrier(input)).length || !input.category || !input.location) throw new Error('Invalid report');
      const userId = await requireUser(this.client);
      const image = input.photoUri ? await this.images.prepare(input.photoUri) : undefined;
      const { data, error } = await this.client.from('barrier_reports').insert({
        user_id: userId, category: input.category, location: input.location, description: input.description.trim(),
        condition_type: input.conditionType, verification_level: 'community_submitted', published: !image,
      }).select('*').single();
      if (error || !data) throw error;
      id = data.id;
      if (!image) return mapBarrier(data, this.images);
      path = `barrier-reports/${userId}/${id}/photo.${image.extension}`;
      await this.images.upload(path, image);
      const result = await this.client.from('barrier_reports').update({ photo_path: path, published: true }).eq('id', id).eq('user_id', userId).select('*').single();
      if (result.error || !result.data) throw result.error;
      return mapBarrier(result.data, this.images);
    } catch (error) {
      await cleanupSubmission(this.client, this.images, 'barrier_reports', id, path);
      throw appError('submit your report; your details are still available', error);
    }
  }
}

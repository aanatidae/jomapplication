import { localCollection, localId } from '../../services/localCollection';
import type { KeyValueStorage } from '../../services/localStorage';
export const contentReportReasons = ['Incorrect route information', 'Inappropriate content', 'Other concern'] as const;
export type ContentReportReason = typeof contentReportReasons[number];
type ContentReport = { id: string; routeId: string; reason: ContentReportReason; reportedAt: string };
export interface ContentReportRepository { create(routeId: string, reason: ContentReportReason): Promise<ContentReport> }
export function createContentReportRepository(storage?: KeyValueStorage): ContentReportRepository {
  const collection = localCollection<ContentReport>('jom.contentFlags.v1', [], storage);
  return { async create(routeId, reason) {
    if (!routeId || !contentReportReasons.includes(reason)) throw new Error('Invalid content report');
    return collection.insert({ id: localId(), routeId, reason, reportedAt: new Date().toISOString() });
  } };
}
export const contentReportRepository = createContentReportRepository();

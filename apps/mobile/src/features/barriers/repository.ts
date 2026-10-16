import { localCollection, localId } from '../../services/localCollection';
import type { KeyValueStorage } from '../../services/localStorage';
import { barrierCategories, type BarrierReport, type BarrierReportRepository, type CreateBarrierReportInput } from './model';
// Configurable demo policy: temporary reports need reconfirmation after 24 hours.
export const TEMPORARY_REPORT_HOURS = 24;
export function validateBarrier(input: CreateBarrierReportInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.category || !Object.hasOwn(barrierCategories, input.category)) errors.category = 'Choose an issue category.';
  if (!input.location || input.location.coordinateSystem !== 'schematic_demo' || !input.location.label.trim() || input.location.point.length !== 2 || input.location.point.some(v => !Number.isFinite(v) || v < 0 || v > 1)) errors.location = 'Choose a labelled route point or demo location.';
  if (!input.description.trim() || input.description.trim().length > 2000) errors.description = 'Describe the issue in 1–2,000 characters.';
  if (!['temporary', 'permanent', 'unknown'].includes(input.conditionType)) errors.condition = 'Choose the condition duration.';
  if (input.photoUri && !/^(file|content):\/\//.test(input.photoUri)) errors.photo = 'Choose a local image.';
  return errors;
}
export function createBarrierRepository(storage?: KeyValueStorage, now = () => new Date(), expiryHours = TEMPORARY_REPORT_HOURS): BarrierReportRepository {
  const collection = localCollection<BarrierReport>('jom.barriers.v1', [], storage);
  return {
    listReports: collection.list,
    async createReport(input) {
      if (Object.keys(validateBarrier(input)).length || !input.category || !input.location) throw new Error('Invalid barrier report');
      const timestamp = now();
      return collection.insert({ id: localId(), category: input.category, location: input.location,
        description: input.description.trim(), photoUri: input.photoUri, conditionType: input.conditionType,
        reportedAt: timestamp.toISOString(), verificationLevel: 'community_submitted',
        ...(input.conditionType === 'temporary' ? { expiresAt: new Date(timestamp.getTime() + expiryHours * 3600000).toISOString() } : {}) });
    },
  };
}
export const barrierRepository = createBarrierRepository();

import { localCollection, localId } from '../../services/localCollection';
import type { KeyValueStorage } from '../../services/localStorage';
import { barrierCategories, type BarrierReport, type BarrierReportRepository, type CreateBarrierReportInput } from './model';
// Configurable demo policy: temporary reports need reconfirmation after 24 hours.
import { TEMPORARY_REPORT_HOURS } from '../quality/policy';
import { validMapPoint } from '../planner/geographic';
export { TEMPORARY_REPORT_HOURS } from '../quality/policy';
export function validateBarrier(input: CreateBarrierReportInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.category || !Object.hasOwn(barrierCategories, input.category)) errors.category = 'Choose an issue category.';
  if (!input.location || !input.location.label.trim() || !validMapPoint(input.location.point, input.location.coordinateSystem)) errors.location = 'Choose a labelled route point or map location.';
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

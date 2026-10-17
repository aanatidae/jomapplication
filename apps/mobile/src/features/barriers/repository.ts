import { isLocalDemo } from '../../services/persistenceMode';
import { getSupabase } from '../../services/supabase/client';
import { SupabaseBarrierReportRepository } from '../../services/supabase/barriers';
import { createBarrierRepository } from './localRepository';
import type { BarrierReportRepository } from './model';
export * from './localRepository';
export const barrierRepository: BarrierReportRepository = isLocalDemo ? createBarrierRepository() : {
  listReports: () => new SupabaseBarrierReportRepository(getSupabase()).listReports(),
  createReport: input => new SupabaseBarrierReportRepository(getSupabase()).createReport(input),
};

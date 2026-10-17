import { isLocalDemo } from '../../services/persistenceMode';
import { getSupabase } from '../../services/supabase/client';
import { SupabaseCommunityRouteRepository } from '../../services/supabase/community';
import { createCommunityRepository } from './localRepository';
import type { CommunityRouteRepository } from './types';
export * from './localRepository';
export const communityRepository: CommunityRouteRepository = isLocalDemo ? createCommunityRepository() : {
  listRoutes: () => new SupabaseCommunityRouteRepository(getSupabase()).listRoutes(),
  getRoute: id => new SupabaseCommunityRouteRepository(getSupabase()).getRoute(id),
  createRoute: input => new SupabaseCommunityRouteRepository(getSupabase()).createRoute(input),
};

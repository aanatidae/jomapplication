import { localCollection, localId } from '../../services/localCollection';
import { type KeyValueStorage } from '../../services/localStorage';
import { seededCommunityRoutes } from './data';
import { accessibilityTags, purposeTags, routeWarnings, type CommunityRoute, type CommunityRouteRepository, type CreateCommunityRouteInput } from './types';
export function validateShare(input: CreateCommunityRouteInput): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.title.trim() || input.title.trim().length > 100) errors.title = 'Enter a title of 1–100 characters.';
  if (!input.route || input.route.geometry.length < 2) errors.route = 'Choose a route to share.';
  if (!input.purposeTags.length || input.purposeTags.some(t => !purposeTags.includes(t))) errors.purpose = 'Choose at least one purpose.';
  if (input.notes.length > 2000) errors.notes = 'Keep notes within 2,000 characters.';
  if (input.accessibilityTags.some(t => !accessibilityTags.includes(t)) || (input.accessibilityTags.includes('Step-free') && input.accessibilityTags.includes('Stairs present'))) errors.accessibility = 'Step-free and stairs present cannot be selected together.';
  if (input.routeWarnings.some(t => !routeWarnings.includes(t))) errors.warnings = 'Choose a listed warning.';
  if (input.lastWalkedAt) {
    const date = new Date(input.lastWalkedAt + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.lastWalkedAt) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== input.lastWalkedAt || input.lastWalkedAt > new Date().toLocaleDateString('en-CA')) errors.date = 'Use a valid past or current date: YYYY-MM-DD.';
  }
  if (input.photos.length > 1 || input.photos.some(uri => !/^(file|content):\/\//.test(uri))) errors.photos = 'Choose one local photo.';
  return errors;
}
export function createCommunityRepository(storage?: KeyValueStorage, seed = seededCommunityRoutes): CommunityRouteRepository {
  const collection = localCollection<CommunityRoute>('jom.community.v1', seed, storage);
  return {
    listRoutes: collection.list,
    async getRoute(id) { return (await collection.list()).find(r => r.id === id) ?? null; },
    async createRoute(input) {
      if (Object.keys(validateShare(input)).length || !input.route) throw new Error('Invalid route');
      return collection.insert({ ...input, route: input.route, title: input.title.trim(), notes: input.notes.trim(), id: localId(), author: 'You · local contributor', createdAt: new Date().toISOString(), verificationLevel: 'community_submitted' });
    },
  };
}

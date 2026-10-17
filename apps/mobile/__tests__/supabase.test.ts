import type { SupabaseClient } from '@supabase/supabase-js';
import type { BarrierRow, CommunityRow, Database, ProfileRow } from '../src/types/database.types';
import { SupabaseUserPreferencesRepository, mapProfile } from '../src/services/supabase/preferences';
import { SupabaseCommunityRouteRepository, mapCommunity } from '../src/services/supabase/community';
import { SupabaseBarrierReportRepository, mapBarrier } from '../src/services/supabase/barriers';
import { MAX_IMAGE_BYTES, SupabaseImages, validateImage } from '../src/services/supabase/images';
import { restoreIdentity, signInGuest } from '../src/services/supabase/auth';
import { cleanupSubmission } from '../src/services/supabase/cleanup';
import { defaultPreferences } from '../src/features/preferences/model';
import { seedPaths } from '../src/features/community/data';
jest.mock('expo-file-system', () => ({ File: jest.fn() }));

const path = seedPaths[0];
const routeRow: CommunityRow = { id: 'r1', user_id: 'u1', title: 'Demo', notes: '', purpose_tags: ['Walking'], route: path, accessibility_tags: [], warnings: [], photo_path: null, last_walked_at: null, verification_level: 'community_submitted', published: true, created_at: '2026-10-17T00:00:00Z', updated_at: '2026-10-17T00:00:00Z' };
const reportRow: BarrierRow = { id: 'b1', user_id: 'u1', category: 'construction', location: { label: 'Demo', coordinateSystem: 'schematic_demo', point: [0.1, 0.2] }, description: 'Demo construction', condition_type: 'temporary', reported_at: '2026-10-17T00:00:00Z', expires_at: '2026-10-18T00:00:00Z', photo_path: null, verification_level: 'community_submitted', published: true, created_at: '', updated_at: '' };
const profileRow: ProfileRow = { id: 'u1', prefer_well_lit: true, avoid_stairs: false, avoid_steep_slopes: true, prefer_ramps_elevators: false, prefer_public_areas: true, prefer_covered_paths: false, max_detour_minutes: 5, onboarding_completed: true, created_at: '', updated_at: '' };
type Result = { data?: unknown; error?: unknown };
function mockClient(results: Result[] = []) {
  const calls: [string, unknown[]][] = [];
  const query: Record<string, jest.Mock> = {};
  for (const method of ['from', 'select', 'insert', 'update', 'delete', 'upsert', 'eq', 'order', 'limit', 'single', 'maybeSingle']) {
    query[method] = jest.fn((...args: unknown[]) => { calls.push([method, args]); return query; });
  }
  query.then = jest.fn((resolve: (v: Result) => void) => Promise.resolve(results.shift() ?? { data: null, error: null }).then(resolve));
  const session = { user: { id: 'u1' } };
  const auth = { getSession: jest.fn().mockResolvedValue({ data: { session }, error: null }), signInAnonymously: jest.fn().mockResolvedValue({ data: { session }, error: null }) };
  const upload = jest.fn().mockResolvedValue({ data: { path: 'p' }, error: null });
  const storage = { from: jest.fn(() => ({ upload, remove: jest.fn().mockResolvedValue({ error: null }), getPublicUrl: (p: string) => ({ data: { publicUrl: 'https://images/' + p } }) })) };
  // Mock SDK boundary; production code remains fully typed.
  return { client: { ...query, auth, storage } as unknown as SupabaseClient<Database>, calls, auth, upload };
}
const image = validateImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]));
function mockImages(client: SupabaseClient<Database>, failed = false) {
  const images = new SupabaseImages(client);
  images.prepare = jest.fn().mockResolvedValue(image);
  images.upload = failed ? jest.fn().mockRejectedValue(new Error('private database detail')) : jest.fn().mockResolvedValue('path');
  images.remove = jest.fn().mockResolvedValue(undefined);
  return images;
}
test('maps all profile preferences and null detour without losing onboarding completion', async () => {
  expect(mapProfile(profileRow)).toEqual({ onboardingCompleted: true, preferences: { ...defaultPreferences, preferWellLit: true, avoidSteepSlopes: true, preferPublicAreas: true, maxDetourMinutes: 5 } });
  expect(mapProfile({ ...profileRow, max_detour_minutes: null }).preferences.maxDetourMinutes).toBeUndefined();
  const { client, calls } = mockClient([{ data: profileRow }, {}]);
  const repo = new SupabaseUserPreferencesRepository(client);
  expect((await repo.load()).preferences.preferWellLit).toBe(true);
  await repo.save({ onboardingCompleted: true, preferences: defaultPreferences });
  expect(calls.find(([method]) => method === 'upsert')?.[1][0]).toMatchObject({ id: 'u1', onboarding_completed: true, max_detour_minutes: null });
});
test('maps route snapshot, public photo, dates and trusted verification state', () => {
  const images = mockImages(mockClient().client);
  expect(mapCommunity({ ...routeRow, photo_path: 'route/photo.jpg', last_walked_at: '2026-10-16' }, images)).toMatchObject({ route: path, photos: ['https://images/route/photo.jpg'], lastWalkedAt: '2026-10-16', verificationLevel: 'community_submitted' });
});
test('maps barrier enum, location, photo, timestamp and expiry', () => {
  const images = mockImages(mockClient().client);
  expect(mapBarrier({ ...reportRow, photo_path: 'report/photo.jpg' }, images)).toMatchObject({ category: 'construction', location: reportRow.location, photoUri: 'https://images/report/photo.jpg', expiresAt: '2026-10-18T00:00:00Z', verificationLevel: 'community_submitted' });
});
test('new routes ignore spoofed ownership/verification and publish only after photo metadata', async () => {
  const { client, calls } = mockClient([{ data: { ...routeRow, published: false } }, { data: { ...routeRow, photo_path: 'community-routes/u1/r1/photo.jpg' } }]);
  const images = mockImages(client);
  const repo = new SupabaseCommunityRouteRepository(client, images);
  const result = await repo.createRoute({ title: ' Test ', notes: '', purposeTags: ['Walking'], route: path, accessibilityTags: [], routeWarnings: [], photos: ['file:///image.jpg'], ...{ user_id: 'attacker', verification_level: 'verified' } });
  expect(calls.find(([method]) => method === 'insert')?.[1][0]).toMatchObject({ user_id: 'u1', verification_level: 'community_submitted', published: false, title: 'Test' });
  expect(images.upload).toHaveBeenCalledWith('community-routes/u1/r1/photo.jpg', image);
  expect(result.photos).toEqual(['https://images/community-routes/u1/r1/photo.jpg']);
});
test('new reports use session ownership and community submitted; expiry comes from DB', async () => {
  const { client, calls } = mockClient([{ data: reportRow }]);
  const result = await new SupabaseBarrierReportRepository(client).createReport({ category: reportRow.category, location: reportRow.location, description: reportRow.description, conditionType: 'temporary', ...{ verification_level: 'verified' } });
  expect(calls.find(([method]) => method === 'insert')?.[1][0]).toMatchObject({ user_id: 'u1', verification_level: 'community_submitted' });
  expect(result.expiresAt).toBe(reportRow.expires_at);
});
test.each(['route', 'report'])('%s upload failure cleans up pending row and attempted photo, exposes friendly error', async kind => {
  const { client, calls } = mockClient([{ data: kind === 'route' ? routeRow : reportRow }, {}]);
  const images = mockImages(client, true);
  const create = kind === 'route' ? new SupabaseCommunityRouteRepository(client, images).createRoute({ title: 'Test', notes: '', purposeTags: ['Walking'], route: path, accessibilityTags: [], routeWarnings: [], photos: ['file:///image.jpg'] }) : new SupabaseBarrierReportRepository(client, images).createReport({ category: 'construction', location: reportRow.location, description: 'Issue', conditionType: 'unknown', photoUri: 'file:///image.jpg' });
  await expect(create).rejects.toThrow('Please try again');
  expect(images.remove).toHaveBeenCalledTimes(1);
  expect(calls.some(([method]) => method === 'delete')).toBe(true);
  expect(calls.some(([method]) => method === 'update')).toBe(false);
});
test('photo metadata failure removes uploaded image and pending row', async () => {
  const { client, calls } = mockClient([{ data: routeRow }, { error: { code: 'failed' } }, {}]);
  const images = mockImages(client);
  await expect(new SupabaseCommunityRouteRepository(client, images).createRoute({ title: 'Test', notes: '', purposeTags: ['Walking'], route: path, accessibilityTags: [], routeWarnings: [], photos: ['file:///image.jpg'] })).rejects.toThrow();
  expect(images.remove).toHaveBeenCalled();
  expect(calls.some(([method]) => method === 'delete')).toBe(true);
});
test('cleanup retains photo when row deletion fails to avoid a published broken reference', async () => {
  const { client } = mockClient([{ error: { code: 'offline' } }]);
  const images = mockImages(client);
  await cleanupSubmission(client, images, 'community_routes', 'r1', 'path');
  expect(images.remove).not.toHaveBeenCalled();
});
test('rejects unsupported, empty and oversized image contents, recognizes JPEG/PNG/WebP', () => {
  expect(() => validateImage(new Uint8Array([1, 2, 3]))).toThrow('JPEG');
  expect(() => validateImage(new Uint8Array())).toThrow('10 MB');
  expect(() => validateImage(new Uint8Array(MAX_IMAGE_BYTES + 1))).toThrow('10 MB');
  expect(image.mime).toBe('image/jpeg');
  expect(validateImage(new Uint8Array([137,80,78,71,13,10,26,10])).extension).toBe('png');
  expect(validateImage(new Uint8Array([82,73,70,70,0,0,0,0,87,69,66,80])).extension).toBe('webp');
});
test('storage sends ArrayBuffer, correct MIME, upsert false and sanitizes upload errors', async () => {
  const { client, upload } = mockClient();
  await new SupabaseImages(client).upload('path', image);
  expect(upload).toHaveBeenCalledWith('path', expect.any(ArrayBuffer), { contentType: 'image/jpeg', upsert: false });
  upload.mockResolvedValueOnce({ error: { message: 'raw SQL detail' } });
  await expect(new SupabaseImages(client).upload('path', image)).rejects.toThrow("Couldn't upload the photo");
});
test('auth restores signed-in and signed-out state, signs in guest and sanitizes failure', async () => {
  const { client, auth } = mockClient();
  expect((await restoreIdentity(client))?.user.id).toBe('u1');
  auth.getSession.mockResolvedValueOnce({ data: { session: null }, error: null });
  expect(await restoreIdentity(client)).toBeNull();
  expect((await signInGuest(client)).user.id).toBe('u1');
  auth.signInAnonymously.mockResolvedValueOnce({ data: {}, error: { message: 'internal auth message' } });
  await expect(signInGuest(client)).rejects.toThrow("Couldn't start your guest session");
});

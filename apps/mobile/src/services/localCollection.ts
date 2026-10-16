import { localStorage, type KeyValueStorage } from './localStorage';
// Serializes read-modify-write operations. Failed writes never publish optimistic data.
export function localCollection<T extends { id: string }>(key: string, seed: readonly T[], storage: KeyValueStorage = localStorage) {
  let queue: Promise<unknown> = Promise.resolve();
  async function list(): Promise<T[]> {
    await queue;
    const raw = await storage.getItem(key);
    if (!raw) return JSON.parse(JSON.stringify(seed)) as T[];
    const rows: unknown = JSON.parse(raw);
    if (!Array.isArray(rows) || !rows.every(r => r && typeof r.id === 'string')) throw new Error('Invalid local collection');
    return rows as T[];
  }
  return {
    list,
    insert(row: T): Promise<T> {
      const pending = queue.then(async () => {
        const raw = await storage.getItem(key);
        const rows = raw ? JSON.parse(raw) as T[] : [...seed];
        if (!Array.isArray(rows)) throw new Error('Invalid local collection');
        await storage.setItem(key, JSON.stringify([row, ...rows]));
        return row;
      });
      queue = pending.catch(() => {});
      return pending;
    },
  };
}
export function localId() { return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`; }

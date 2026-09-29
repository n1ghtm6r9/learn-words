import type { Word } from '@/db/word.type';

export function syncSessionPool(pool: Word[] | null, stored: Word[]): Word[] {
  if (pool === null) return stored;

  const storedIds = new Set(stored.map((word) => word.id));
  const poolIds = new Set(pool.map((word) => word.id));
  const kept = pool.filter((word) => storedIds.has(word.id));
  const added = stored.filter((word) => !poolIds.has(word.id));

  return kept.length === pool.length && added.length === 0 ? pool : [...kept, ...added];
}

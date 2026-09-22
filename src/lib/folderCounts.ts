import type { Word } from '@/db/word.type';

export function folderCounts(words: Word[]): Map<number | null, number> {
  const counts = new Map<number | null, number>();

  for (const word of words) {
    const key = word.folderId ?? null;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

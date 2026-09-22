import type { Word } from '@/db/word.type';
import type { WordTag } from '@/db/wordTag.type';

export function tagCounts(words: Word[], links: WordTag[]): Map<number, number> {
  const usable = new Set(words.map((word) => word.id));
  const counts = new Map<number, number>();

  for (const link of links) {
    if (!usable.has(link.wordId)) continue;
    counts.set(link.tagId, (counts.get(link.tagId) ?? 0) + 1);
  }

  return counts;
}

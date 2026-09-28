import type { WordTag } from '@/db/wordTag.type';

export function tagsByWord(links: WordTag[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  for (const link of links) {
    const owned = grouped.get(link.wordId);
    if (owned) {
      owned.push(link.tagId);
    } else {
      grouped.set(link.wordId, [link.tagId]);
    }
  }

  return grouped;
}

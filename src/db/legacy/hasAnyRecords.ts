import type { VocabDB } from '../VocabDB';

export async function hasAnyRecords(db: VocabDB): Promise<boolean> {
  const counts = await Promise.all([db.words.count(), db.folders.count(), db.tags.count(), db.wordTags.count()]);
  return counts.some((count) => count > 0);
}

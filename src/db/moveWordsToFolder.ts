import type { VocabDB } from './VocabDB';

export async function moveWordsToFolder(
  db: VocabDB,
  wordIds: number[],
  folderId: number | null,
): Promise<number> {
  if (wordIds.length === 0) return 0;

  return db.transaction('rw', db.words, async () => {
    return db.words
      .where('id')
      .anyOf(wordIds)
      .modify((word) => {
        if (folderId == null) {
          delete word.folderId;
        } else {
          word.folderId = folderId;
        }
      });
  });
}

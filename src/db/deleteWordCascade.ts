import type { VocabDB } from './VocabDB';

export async function deleteWordCascade(db: VocabDB, wordId: number): Promise<void> {
  await db.transaction('rw', db.words, db.wordTags, async () => {
    await db.wordTags.where('wordId').equals(wordId).delete();
    await db.words.delete(wordId);
  });
}

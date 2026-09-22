import type { VocabDB } from './VocabDB';

export async function moveWordToFolder(db: VocabDB, wordId: number, folderId: number | null): Promise<void> {
  await db.words.update(wordId, folderId == null ? { folderId: undefined } : { folderId });
}

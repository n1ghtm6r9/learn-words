import type { VocabDB } from './VocabDB';

export async function moveWordToFolder(db: VocabDB, wordId: string, folderId: string | null): Promise<void> {
  await db.words.update(wordId, folderId == null ? { folderId: undefined } : { folderId });
}

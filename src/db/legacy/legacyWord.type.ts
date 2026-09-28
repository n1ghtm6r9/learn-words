import type { Word } from '../word.type';

export interface LegacyWord extends Omit<Word, 'id' | 'folderId'> {
  id?: number;
  folderId?: number;
}

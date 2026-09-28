import type { Word } from '@/db/word.type';

export interface ExportedWord extends Omit<Word, 'id' | 'folderId'> {
  folder?: string;
  tags?: string[];
}

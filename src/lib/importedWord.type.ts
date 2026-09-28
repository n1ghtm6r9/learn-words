import type { Word } from '@/db/word.type';

export type ImportedWord = Pick<Word, 'term' | 'translation'> &
  Partial<Omit<Word, 'folderId'>> & {
    rating?: number;
    folder?: string;
    tags?: string[];
  };

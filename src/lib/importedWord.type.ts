import type { Word } from '@/db/word.type';

export type ImportedWord = Pick<Word, 'term' | 'translation'> &
  Partial<Word> & {
    rating?: number;
  };

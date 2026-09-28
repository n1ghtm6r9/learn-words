import type { Word } from './word.type';

export function isUsableWord(word: Pick<Word, 'term' | 'translation'>): boolean {
  return typeof word.term === 'string' && typeof word.translation === 'string';
}

import type { Word } from './word.type';

export function isUsableWord(word: Word): boolean {
  return typeof word.term === 'string' && typeof word.translation === 'string';
}

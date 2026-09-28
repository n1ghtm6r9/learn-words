import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { duplicateKey } from '@/lib/duplicateKey';
import { normalizeTerm } from '@/lib/normalizeTerm';
import type { Word } from '../word.type';

export function wordIdentityKey(word: Pick<Word, 'term' | 'translation'>, language: StudyLanguage): string {
  return `${duplicateKey(word.term, language)}\u0000${normalizeTerm(word.translation).toLocaleLowerCase()}`;
}

import { detectWordKind } from '@/lib/detectWordKind';
import { normalizeTerm } from '@/lib/normalizeTerm';
import type { Word } from './word.type';

export function createWord(rawTerm: string, rawTranslation: string): Word {
  const term = normalizeTerm(rawTerm);
  const translation = normalizeTerm(rawTranslation);

  return {
    term,
    translation,
    createdAt: Date.now(),
    kind: detectWordKind(term),
    stage: 'new',
    learningPhase: 'A',
    phaseStreak: 0,
    rating: 0,
    reviewStreak: 0,
  };
}

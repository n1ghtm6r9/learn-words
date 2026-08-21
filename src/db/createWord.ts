import { detectWordKind } from '@/lib/detectWordKind';
import { DEFAULT_DIFFICULTY, INITIAL_STABILITY_DAYS } from '@/lib/memoryParams';
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
    stability: INITIAL_STABILITY_DAYS,
    difficulty: DEFAULT_DIFFICULTY,
    reviewStreak: 0,
  };
}

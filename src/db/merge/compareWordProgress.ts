import type { Word } from '../word.type';
import { compareIds } from './compareIds';

function rank(value: boolean): number {
  return value ? 0 : 1;
}

export function compareWordProgress(a: Word, b: Word): number {
  return (
    rank(a.stage === 'review') - rank(b.stage === 'review') ||
    rank(a.learningPhase === 'B') - rank(b.learningPhase === 'B') ||
    b.stability - a.stability ||
    (b.lastReviewedAt ?? 0) - (a.lastReviewedAt ?? 0) ||
    b.phaseStreak - a.phaseStreak ||
    a.createdAt - b.createdAt ||
    compareIds(a, b)
  );
}

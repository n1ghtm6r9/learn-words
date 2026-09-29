import type { Word } from '@/db/word.type';

type StepState = Pick<Word, 'learningPhase' | 'phaseStreak'>;

export function sessionStepProgress(
  pool: StepState[],
  learnedCount: number,
  phaseARepeats: number,
  phaseBRepeats: number,
): { done: number; total: number } {
  const stepsPerWord = phaseARepeats + phaseBRepeats;
  const poolDone = pool.reduce(
    (sum, word) =>
      sum +
      (word.learningPhase === 'A'
        ? Math.min(word.phaseStreak, phaseARepeats)
        : phaseARepeats + Math.min(word.phaseStreak, phaseBRepeats)),
    0,
  );
  return {
    done: learnedCount * stepsPerWord + poolDone,
    total: (learnedCount + pool.length) * stepsPerWord,
  };
}

import { elapsedDays } from './elapsedDays';
import { isDue } from './isDue';
import { lapsedStability } from './lapsedStability';
import { nextDifficulty } from './nextDifficulty';
import { nextStability } from './nextStability';
import { retrievability } from './retrievability';
import { INITIAL_STABILITY_DAYS, RELEARN_DIFFICULTY, RELEARN_STABILITY_DAYS, TARGET_RETENTION } from './memoryParams';
import type { MemoryState } from './memoryState.type';
import type { MatchVerdict } from './fuzzyMatch';
import type { ReviewOutcome } from './reviewOutcome.type';

export function applyReviewOutcome(
  state: MemoryState,
  verdict: MatchVerdict,
  accuracy: number,
  speedFactor: number,
  now: number,
): ReviewOutcome {
  const recallChance =
    state.lastReviewedAt == null
      ? TARGET_RETENTION
      : retrievability(elapsedDays(state.lastReviewedAt, now), state.stability);

  if (verdict !== 'wrong' && !isDue(state, now)) {
    return {
      stability: state.stability,
      difficulty: state.difficulty,
      reviewStreak: state.reviewStreak,
      lastReviewedAt: state.lastReviewedAt!,
    };
  }

  const stability =
    verdict === 'wrong'
      ? lapsedStability(state.stability, state.difficulty, recallChance)
      : nextStability(state.stability, state.difficulty, recallChance, verdict === 'almost', speedFactor);

  const difficulty = nextDifficulty(state.difficulty, verdict, accuracy, speedFactor);
  const reviewStreak =
    verdict === 'correct' ? state.reviewStreak + 1 : verdict === 'wrong' ? 0 : state.reviewStreak;

  if (verdict === 'wrong' && stability <= RELEARN_STABILITY_DAYS && difficulty >= RELEARN_DIFFICULTY) {
    return {
      stability: INITIAL_STABILITY_DAYS,
      difficulty,
      reviewStreak: 0,
      lastReviewedAt: now,
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
    };
  }

  return { stability, difficulty, reviewStreak, lastReviewedAt: now };
}

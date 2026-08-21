import { elapsedDays } from './elapsedDays';
import { retrievability } from './retrievability';
import { roundRating } from './roundRating';
import type { MemoryState } from './memoryState.type';

export function effectiveRating(state: MemoryState, now: number): number {
  if (state.lastReviewedAt == null) return 0;

  const recallChance = retrievability(elapsedDays(state.lastReviewedAt, now), state.stability);
  return roundRating(recallChance * 100);
}

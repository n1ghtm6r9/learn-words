import { clamp } from './clamp';
import { halfLifeDays } from './halfLifeDays';
import { DAY_MS } from './time';
import type { RatingState } from './ratingState.type';

export function effectiveRating(state: RatingState, now: number): number {
  if (state.lastReviewedAt == null) {
    return clamp(Math.round(state.rating), 0, 100);
  }

  const daysSince = Math.max(0, (now - state.lastReviewedAt) / DAY_MS);
  const decayed = state.rating * 0.5 ** (daysSince / halfLifeDays(state.reviewStreak));
  return clamp(Math.round(decayed), 0, 100);
}

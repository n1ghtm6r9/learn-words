import { clamp } from './clamp';
import { effectiveRating } from './effectiveRating';
import type { RatingState } from './ratingState.type';
import type { MatchVerdict } from './fuzzyMatch';

export function applyReviewOutcome(state: RatingState, verdict: MatchVerdict, now: number): RatingState {
  const current = effectiveRating(state, now);

  if (verdict === 'correct') {
    return { rating: clamp(current + 15, 0, 100), reviewStreak: state.reviewStreak + 1, lastReviewedAt: now };
  }
  if (verdict === 'almost') {
    return { rating: clamp(current + 5, 0, 100), reviewStreak: 0, lastReviewedAt: now };
  }
  return { rating: clamp(current - 25, 0, 100), reviewStreak: 0, lastReviewedAt: now };
}

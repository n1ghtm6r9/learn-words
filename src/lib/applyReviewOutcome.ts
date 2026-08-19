import { clamp } from './clamp';
import { effectiveRating } from './effectiveRating';
import type { RatingState } from './ratingState.type';
import type { MatchVerdict } from './fuzzyMatch';
import type { ReviewOutcome } from './reviewOutcome.type';

const CORRECT_RATING_GAIN = 15;
const WRONG_RATING_LOSS = 25;

export function applyReviewOutcome(state: RatingState, verdict: MatchVerdict, now: number): ReviewOutcome {
  const current = effectiveRating(state, now);

  if (verdict === 'correct') {
    return {
      rating: clamp(current + CORRECT_RATING_GAIN, 0, 100),
      reviewStreak: state.reviewStreak + 1,
      lastReviewedAt: now,
    };
  }

  if (verdict === 'almost') {
    return { rating: current, reviewStreak: state.reviewStreak, lastReviewedAt: now };
  }

  const rating = clamp(current - WRONG_RATING_LOSS, 0, 100);
  if (rating <= 0) {
    return {
      rating: 0,
      reviewStreak: 0,
      lastReviewedAt: now,
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
    };
  }
  return { rating, reviewStreak: 0, lastReviewedAt: now };
}

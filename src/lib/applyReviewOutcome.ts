import { clamp } from './clamp';
import { effectiveRating } from './effectiveRating';
import { roundRating } from './roundRating';
import type { RatingState } from './ratingState.type';
import type { MatchVerdict } from './fuzzyMatch';
import type { ReviewOutcome } from './reviewOutcome.type';

const BASE_REWARD = 10;
const STREAK_BONUS_PER_STEP = 2;
const MAX_STREAK_BONUS_STEPS = 10;

const MINOR_PENALTY = 3;
const MIN_PENALTY = 4;
const MAX_PENALTY = 30;

const MAX_RESILIENCE_STEPS = 10;
const MAX_PENALTY_REDUCTION = 0.4;

function penaltyResilience(reviewStreak: number): number {
  const provenKnowledge = Math.min(reviewStreak, MAX_RESILIENCE_STEPS) / MAX_RESILIENCE_STEPS;
  return 1 - provenKnowledge * MAX_PENALTY_REDUCTION;
}

function ratingDelta(
  verdict: MatchVerdict,
  accuracy: number,
  reviewStreak: number,
  speedFactor: number,
): number {
  if (verdict === 'correct') {
    const streakBonus = Math.min(reviewStreak, MAX_STREAK_BONUS_STEPS) * STREAK_BONUS_PER_STEP;
    return (BASE_REWARD + streakBonus) * speedFactor;
  }

  if (verdict === 'almost') {
    return -(MINOR_PENALTY * penaltyResilience(reviewStreak));
  }

  const severity = clamp(1 - accuracy, 0, 1);
  const penalty = MIN_PENALTY + severity * (MAX_PENALTY - MIN_PENALTY);
  return -(penalty * penaltyResilience(reviewStreak));
}

export function applyReviewOutcome(
  state: RatingState,
  verdict: MatchVerdict,
  accuracy: number,
  speedFactor: number,
  now: number,
): ReviewOutcome {
  const current = effectiveRating(state, now);
  const delta = ratingDelta(verdict, accuracy, state.reviewStreak, speedFactor);
  const rating = clamp(roundRating(current + delta), 0, 100);
  const reviewStreak = verdict === 'correct' ? state.reviewStreak + 1 : verdict === 'wrong' ? 0 : state.reviewStreak;

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

  return { rating, reviewStreak, lastReviewedAt: now };
}

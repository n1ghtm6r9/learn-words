import { clamp } from './clamp';
import { INITIAL_STABILITY_DAYS, MAX_STABILITY_DAYS, MIN_STABILITY_DAYS } from './memoryParams';
import { stableHash } from './stableHash';

const KNOWN_WORD_STABILITY_DAYS = 10;
const SPREAD_BUCKETS = 21;
const SPREAD_MIN = 0.5;
const SPREAD_STEP = 0.1;
const TRUST_FLOOR = INITIAL_STABILITY_DAYS / 2;
const MAX_TRUSTED_STREAK = 10;
const STREAK_TRUST_STEP = 0.1;

function trustFromRating(rating: number): number {
  const share = clamp(rating, 0, 100) / 100;
  return TRUST_FLOOR + (KNOWN_WORD_STABILITY_DAYS - TRUST_FLOOR) * share ** 3;
}

export function seedStabilityFromLegacyRating(
  rating: number,
  reviewStreak: number,
  spreadKey: string,
): number {
  const trustedStreak = clamp(reviewStreak, 0, MAX_TRUSTED_STREAK);
  const provenByReviews = 1 + trustedStreak * STREAK_TRUST_STEP;
  const spread = SPREAD_MIN + (stableHash(spreadKey) % SPREAD_BUCKETS) * SPREAD_STEP;

  return clamp(trustFromRating(rating) * provenByReviews * spread, MIN_STABILITY_DAYS, MAX_STABILITY_DAYS);
}

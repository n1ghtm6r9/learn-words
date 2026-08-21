import { clamp } from './clamp';
import { difficultyEase } from './difficultyEase';
import {
  LAPSE_BASE,
  LAPSE_RETENTION_EXPONENT,
  LAPSE_SPACING_WEIGHT,
  MIN_STABILITY_DAYS,
} from './memoryParams';

export function lapsedStability(
  stability: number,
  difficulty: number,
  retrievabilityAtReview: number,
): number {
  const safeStability = Math.max(stability, MIN_STABILITY_DAYS);
  const retained = safeStability ** LAPSE_RETENTION_EXPONENT;
  const forgiveness = Math.exp(LAPSE_SPACING_WEIGHT * (1 - clamp(retrievabilityAtReview, 0, 1)));
  const lapsed = LAPSE_BASE * difficultyEase(difficulty) * retained * forgiveness;

  return clamp(lapsed, MIN_STABILITY_DAYS, safeStability);
}

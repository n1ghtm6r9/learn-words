import { clamp } from './clamp';
import { difficultyEase } from './difficultyEase';
import {
  GROWTH_SCALE,
  MAX_STABILITY_DAYS,
  MINOR_ERROR_GROWTH_FACTOR,
  MIN_STABILITY_DAYS,
  SATURATION_EXPONENT,
  SPACING_WEIGHT,
  SPEED_FLOOR,
  SPEED_SPAN,
} from './memoryParams';

export function nextStability(
  stability: number,
  difficulty: number,
  retrievabilityAtReview: number,
  wasMinorError: boolean,
  speedFactor: number,
): number {
  const safeStability = Math.max(stability, MIN_STABILITY_DAYS);
  const saturation = safeStability ** -SATURATION_EXPONENT;
  const spacingGain = Math.exp(SPACING_WEIGHT * (1 - clamp(retrievabilityAtReview, 0, 1))) - 1;
  const speed = SPEED_FLOOR + SPEED_SPAN * clamp(speedFactor, 0, 1);
  const grade = wasMinorError ? MINOR_ERROR_GROWTH_FACTOR : 1;

  const growth =
    1 + GROWTH_SCALE * difficultyEase(difficulty) * saturation * spacingGain * grade * speed;

  return clamp(safeStability * growth, MIN_STABILITY_DAYS, MAX_STABILITY_DAYS);
}

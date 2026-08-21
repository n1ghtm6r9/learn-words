import { clamp } from './clamp';
import { MIN_STABILITY_DAYS, RETRIEVABILITY_DECAY, RETRIEVABILITY_FACTOR } from './memoryParams';

export function retrievability(elapsedDays: number, stability: number): number {
  const days = Math.max(0, elapsedDays);
  const safeStability = Math.max(stability, MIN_STABILITY_DAYS);
  const value = (1 + (RETRIEVABILITY_FACTOR * days) / safeStability) ** RETRIEVABILITY_DECAY;
  return clamp(value, 0, 1);
}

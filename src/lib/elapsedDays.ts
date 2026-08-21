import { DAY_MS } from './time';

export function elapsedDays(lastReviewedAt: number, now: number): number {
  return Math.max(0, (now - lastReviewedAt) / DAY_MS);
}

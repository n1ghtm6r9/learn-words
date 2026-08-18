import type { RatingColor } from './ratingColor.type';

export function ratingColor(effectiveRating: number): RatingColor {
  if (effectiveRating >= 67) return 'green';
  if (effectiveRating >= 34) return 'yellow';
  return 'red';
}

import type { RatingColor } from '@/lib/ratingColor.type';

export const RATING_STROKE_CLASS: Record<RatingColor, string> = {
  green: 'stroke-status-mastered',
  yellow: 'stroke-status-learning',
  red: 'stroke-destructive',
};

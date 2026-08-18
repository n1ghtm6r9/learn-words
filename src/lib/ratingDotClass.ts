import type { RatingColor } from './ratingColor.type';

export const RATING_DOT_CLASS: Record<RatingColor, string> = {
  green: 'bg-status-mastered',
  yellow: 'bg-status-learning',
  red: 'bg-destructive',
};

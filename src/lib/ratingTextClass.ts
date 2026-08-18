import type { RatingColor } from './ratingColor.type';

export const RATING_TEXT_CLASS: Record<RatingColor, string> = {
  green: 'text-status-mastered',
  yellow: 'text-status-learning',
  red: 'text-rating-critical',
};

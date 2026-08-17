import type { MasteryStatus } from './masteryStatus.type';

export const STATUS_DOT_CLASS: Record<MasteryStatus, string> = {
  new: 'bg-status-new',
  learning: 'bg-status-learning',
  mastered: 'bg-status-mastered',
};

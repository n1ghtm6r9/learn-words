export type MasteryStatus = 'new' | 'learning' | 'mastered';

export function masteryStatus(interval: number, masteredThresholdDays = 21): MasteryStatus {
  if (interval <= 0) return 'new';
  if (interval >= masteredThresholdDays) return 'mastered';
  return 'learning';
}

export const MASTERY_LABEL: Record<MasteryStatus, string> = {
  new: 'Новое',
  learning: 'Учу',
  mastered: 'Выучено',
};

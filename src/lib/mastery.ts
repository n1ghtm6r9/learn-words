import type { MasteryStatus } from './masteryStatus.type';

export function masteryStatus(interval: number, masteredThresholdDays = 21): MasteryStatus {
  if (interval <= 0) return 'new';
  if (interval >= masteredThresholdDays) return 'mastered';
  return 'learning';
}

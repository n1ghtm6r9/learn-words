import { clamp } from './clamp';
import { MAX_STABILITY_DAYS, MIN_STABILITY_DAYS } from './memoryParams';
import { DAY_MS } from './time';
import type { MemoryState } from './memoryState.type';

export function dueAt(state: MemoryState): number | null {
  if (state.lastReviewedAt == null) return null;
  return state.lastReviewedAt + clamp(state.stability, MIN_STABILITY_DAYS, MAX_STABILITY_DAYS) * DAY_MS;
}

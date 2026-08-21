import { dueAt } from './dueAt';
import type { MemoryState } from './memoryState.type';

export function isDue(state: MemoryState, now: number): boolean {
  const due = dueAt(state);
  return due == null || due <= now;
}

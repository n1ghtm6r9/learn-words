import { clamp } from './clamp';
import { DEFAULT_DIFFICULTY, MAX_DIFFICULTY, MIN_DIFFICULTY } from './memoryParams';

export function difficultyEase(difficulty: number): number {
  const safe = clamp(Number.isFinite(difficulty) ? difficulty : DEFAULT_DIFFICULTY, MIN_DIFFICULTY, MAX_DIFFICULTY);
  return (MAX_DIFFICULTY + 1 - safe) / MAX_DIFFICULTY;
}

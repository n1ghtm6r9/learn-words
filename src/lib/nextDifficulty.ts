import { clamp } from './clamp';
import { DEFAULT_DIFFICULTY, DIFFICULTY_REVERSION, MAX_DIFFICULTY, MIN_DIFFICULTY } from './memoryParams';
import type { MatchVerdict } from './fuzzyMatch';

const CORRECT_BASE_STEP = -0.2;
const CORRECT_SPEED_STEP = -0.2;
const MINOR_ERROR_STEP = 0.4;
const MAJOR_ERROR_STEP = 1.2;

const MAJOR_ERROR_FLOOR_SHARE = 0.6;

function step(verdict: MatchVerdict, accuracy: number, speedFactor: number): number {
  if (verdict === 'correct') return CORRECT_BASE_STEP + CORRECT_SPEED_STEP * clamp(speedFactor, 0, 1);
  if (verdict === 'almost') return MINOR_ERROR_STEP;

  const severity = clamp(1 - accuracy, 0, 1);
  return MAJOR_ERROR_STEP * (MAJOR_ERROR_FLOOR_SHARE + (1 - MAJOR_ERROR_FLOOR_SHARE) * severity);
}

export function nextDifficulty(
  difficulty: number,
  verdict: MatchVerdict,
  accuracy: number,
  speedFactor: number,
): number {
  const known = Number.isFinite(difficulty) ? difficulty : DEFAULT_DIFFICULTY;
  const moved = known + step(verdict, accuracy, speedFactor);
  const reverted = moved + DIFFICULTY_REVERSION * (DEFAULT_DIFFICULTY - moved);
  return clamp(reverted, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

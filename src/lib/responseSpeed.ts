const FIXED_OVERHEAD_MS = 600;
const MS_PER_CHAR = 150;
const SLOW_MULTIPLIER = 3;
const MIN_SPEED_FACTOR = 0.5;

export function speedFactor(elapsedMs: number, expectedLength: number): number {
  const fastMs = FIXED_OVERHEAD_MS + expectedLength * MS_PER_CHAR;
  const slowMs = fastMs * SLOW_MULTIPLIER;

  if (elapsedMs <= fastMs) return 1;
  if (elapsedMs >= slowMs) return MIN_SPEED_FACTOR;

  const t = (elapsedMs - fastMs) / (slowMs - fastMs);
  return 1 - t * (1 - MIN_SPEED_FACTOR);
}

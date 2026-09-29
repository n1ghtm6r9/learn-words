const DISTANCE_RATIO = 0.25;
const FLING_VELOCITY = 0.5;

export function shouldDismissSheet(offset: number, height: number, velocity: number): boolean {
  if (offset <= 0) return false;
  return offset > height * DISTANCE_RATIO || velocity > FLING_VELOCITY;
}

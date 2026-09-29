export function rubberBandOffset(distance: number, limit: number): number {
  if (distance >= 0) return distance;
  return -limit * (1 - Math.exp(distance / (limit * 3)));
}

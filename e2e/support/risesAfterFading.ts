const TOLERANCE = 0.02;

export function risesAfterFading(trace: number[]): boolean {
  return trace.some((value, index) => index > 0 && value > trace[index - 1] + TOLERANCE);
}

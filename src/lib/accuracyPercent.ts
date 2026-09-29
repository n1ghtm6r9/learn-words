export function accuracyPercent(correct: number, answered: number): number {
  if (answered <= 0) return 0;
  return Math.round((Math.min(correct, answered) / answered) * 100);
}

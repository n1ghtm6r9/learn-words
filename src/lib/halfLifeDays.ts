export function halfLifeDays(reviewStreak: number): number {
  return 2 + reviewStreak * 3;
}

import type { ReviewLog } from '../db/reviewLog.type';
import type { Word } from '../db/word.type';
import { DAY_MS } from './srs';
import { masteryStatus } from './mastery';

export function computeAccuracy(reviews: ReviewLog[], sinceDays: number, now: number): number {
  const since = now - sinceDays * DAY_MS;
  const recent = reviews.filter((r) => r.reviewedAt >= since && r.reviewedAt <= now);
  if (recent.length === 0) return 0;

  const correctCount = recent.filter((r) => r.correct).length;
  return Math.round((correctCount / recent.length) * 100);
}

function dayKey(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeStreak(reviews: ReviewLog[], now: number): number {
  const daysWithReview = new Set(reviews.map((r) => dayKey(r.reviewedAt)));
  let streak = 0;
  let cursor = now;

  while (daysWithReview.has(dayKey(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }

  return streak;
}

export function countMastered(words: Word[], thresholdDays = 21): number {
  return words.filter((w) => masteryStatus(w.interval, thresholdDays) === 'mastered').length;
}

export function last30DaysActivity(reviews: ReviewLog[], now: number): boolean[] {
  const daysWithReview = new Set(reviews.map((r) => dayKey(r.reviewedAt)));
  const days: boolean[] = [];

  for (let i = 29; i >= 0; i--) {
    days.push(daysWithReview.has(dayKey(now - i * DAY_MS)));
  }

  return days;
}

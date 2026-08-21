import { effectiveRating } from './effectiveRating';
import { isDue } from './isDue';
import type { Word } from '@/db/word.type';

function mostFadedFirst(a: Word, b: Word, now: number): number {
  return effectiveRating(a, now) - effectiveRating(b, now);
}

export function buildReviewQueue(words: Word[], now: number, limit: number): Word[] {
  const room = Number.isFinite(limit) ? Math.max(0, limit) : 0;
  const due = words.filter((word) => isDue(word, now)).sort((a, b) => mostFadedFirst(a, b, now));

  if (due.length >= room) return due.slice(0, room);

  const ahead = words
    .filter((word) => !isDue(word, now))
    .sort((a, b) => mostFadedFirst(a, b, now))
    .slice(0, room - due.length);

  return [...due, ...ahead];
}

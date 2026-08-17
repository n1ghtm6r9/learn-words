import { useLiveQuery } from 'dexie-react-hooks';
import { BookCheck, Flame, Target } from 'lucide-react';
import { db } from '@/db/db';
import { computeAccuracy, computeStreak, countMastered, last30DaysActivity } from '@/lib/stats';

export function StatsPage() {
  const words = useLiveQuery(() => db.words.toArray(), []) ?? [];
  const reviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];
  const now = Date.now();

  const mastered = countMastered(words);
  const accuracy7 = computeAccuracy(reviews, 7, now);
  const accuracy30 = computeAccuracy(reviews, 30, now);
  const streak = computeStreak(reviews, now);
  const activity = last30DaysActivity(reviews, now);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center shadow-sm">
          <BookCheck className="h-4 w-4 text-status-mastered" aria-hidden="true" />
          <p className="font-mono text-xs leading-snug text-muted-foreground">
            {'Выучено слов: '}
            {mastered}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center shadow-sm">
          <Flame className="h-4 w-4 text-status-learning" aria-hidden="true" />
          <p className="font-mono text-xs leading-snug text-muted-foreground">Streak: {streak} дн.</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center shadow-sm">
          <Target className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="font-mono text-xs leading-snug text-muted-foreground">
            {'Точность за 30 дней: '}
            {accuracy30}%
          </p>
        </div>
      </div>

      <p className="font-mono text-sm text-muted-foreground">Точность за 7 дней: {accuracy7}%</p>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">Активность за 30 дней</p>
        <div className="grid grid-cols-10 gap-1.5">
          {activity.map((active, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-sm ${active ? 'bg-status-mastered' : 'bg-secondary'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

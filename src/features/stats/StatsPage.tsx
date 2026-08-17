import { useLiveQuery } from 'dexie-react-hooks';
import { BookCheck, Flame, Target } from 'lucide-react';
import { db } from '@/db/db';
import { computeAccuracy, computeStreak, countMastered, last30DaysActivity } from '@/lib/stats';
import { StatTile } from './StatTile';

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
        <StatTile icon={BookCheck} iconClassName="text-status-mastered">
          {'Выучено слов: '}
          {mastered}
        </StatTile>
        <StatTile icon={Flame} iconClassName="text-status-learning">
          Streak: {streak} дн.
        </StatTile>
        <StatTile icon={Target} iconClassName="text-primary">
          {'Точность за 30 дней: '}
          {accuracy30}%
        </StatTile>
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

import { useLiveQuery } from 'dexie-react-hooks';
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
      <div className="rounded-lg border p-4">
        <p>Выучено слов: {mastered}</p>
        <p>Точность за 7 дней: {accuracy7}%</p>
        <p>Точность за 30 дней: {accuracy30}%</p>
        <p>Streak: {streak} дн.</p>
      </div>

      <div>
        <p className="mb-2 text-sm text-muted-foreground">Активность за 30 дней</p>
        <div className="grid grid-cols-10 gap-1">
          {activity.map((active, i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-sm ${active ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { selectDueWords } from '@/lib/srs';
import { computeStreak } from '@/lib/stats';
import { useUIStore } from '@/store/useUIStore';

export function Dashboard() {
  const words = useLiveQuery(() => db.words.toArray(), []) ?? [];
  const reviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];
  const setScreen = useUIStore((s) => s.setScreen);

  const now = Date.now();
  const dueCount = selectDueWords(words, now, Number.POSITIVE_INFINITY).length;
  const streak = computeStreak(reviews, now);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border p-4">
        <p>Слов на сегодня: {dueCount}</p>
        <p>Всего слов: {words.length}</p>
        <p>Streak: {streak} дн.</p>
      </div>

      <div className="flex gap-2">
        <Button type="button" disabled={dueCount === 0} onClick={() => setScreen('study')}>
          Учить
        </Button>
        <Button type="button" variant="outline" onClick={() => setScreen('add')}>
          Добавить слово
        </Button>
      </div>
    </div>
  );
}

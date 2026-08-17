import { useLiveQuery } from 'dexie-react-hooks';
import { Flame, Layers, Plus, SquareLibrary } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { db } from '@/db/db';
import { selectDueWords } from '@/lib/srs';
import { computeStreak } from '@/lib/stats';
import { useUIStore } from '@/store/useUIStore';

export function Dashboard() {
  const words = useLiveQuery(() => db.words.toArray(), []);
  const reviews = useLiveQuery(() => db.reviews.toArray(), []);
  const setScreen = useUIStore((s) => s.setScreen);

  if (!words || !reviews) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  const now = Date.now();
  const dueCount = selectDueWords(words, now, Number.POSITIVE_INFINITY).length;
  const streak = computeStreak(reviews, now);

  return (
    <div className="flex flex-col gap-5">
      <Card className="p-4">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <Layers className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="font-mono">Слов на сегодня: {dueCount}</p>
        </div>
        <div className="flex items-center gap-3 border-b border-border py-3">
          <SquareLibrary className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="font-mono">Всего слов: {words.length}</p>
        </div>
        <div className="flex items-center gap-3 pt-3">
          <Flame className="h-4 w-4 shrink-0 text-status-learning" aria-hidden="true" />
          <p className="font-mono">Streak: {streak} дн.</p>
        </div>
      </Card>

      <div className="flex gap-2">
        <Button type="button" disabled={dueCount === 0} onClick={() => setScreen('study')}>
          Учить
        </Button>
        <Button type="button" variant="outline" onClick={() => setScreen('add')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Добавить слово
        </Button>
      </div>
    </div>
  );
}

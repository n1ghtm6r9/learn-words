import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import { effectiveRating } from '@/lib/effectiveRating';
import { applyReviewOutcome } from '@/lib/applyReviewOutcome';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import { useUIStore } from '@/store/useUIStore';
import { RecallCard } from '@/features/study/RecallCard';
import { ReviewSummary } from './ReviewSummary';

interface Counters {
  correct: number;
  almost: number;
  wrong: number;
}

export function ReviewSession() {
  const [queue, setQueue] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [counters, setCounters] = useState<Counters>({ correct: 0, almost: 0, wrong: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setScreen = useUIStore((s) => s.setScreen);

  useEffect(() => {
    let cancelled = false;
    void db.words
      .where('stage')
      .equals('review')
      .toArray()
      .then((words) => {
        if (cancelled) return;
        const now = Date.now();
        const sorted = [...words].sort(
          (a, b) => effectiveRating(a, now) - effectiveRating(b, now),
        );
        setQueue(sorted);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAnswer(word: Word, verdict: MatchVerdict) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const wordId = word.id;
    if (wordId != null) {
      try {
        const next = applyReviewOutcome(word, verdict, Date.now());
        await db.words.update(wordId, next);
      } catch {
        // проглатываем: слово остаётся в stage 'review' и попадёт в следующую
        // сессию — лучше не сохранить один результат, чем зависнуть без выхода
      }
    }
    setCounters((c) => ({ ...c, [verdict]: c[verdict] + 1 }));
    setIndex((i) => i + 1);
    setIsSubmitting(false);
  }

  if (queue === null) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">Пока нечего повторять — сначала выучите новые слова.</p>
        <Button type="button" onClick={() => setScreen('newWords')}>
          Новые слова
        </Button>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <ReviewSummary
        correct={counters.correct}
        almost={counters.almost}
        wrong={counters.wrong}
        onFinish={() => setScreen('newWords')}
      />
    );
  }

  const current = queue[index];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-right font-mono text-xs text-muted-foreground">
        {index + 1} из {queue.length}
      </p>
      <RecallCard
        key={current.id}
        translation={current.translation}
        expectedTerm={current.term}
        onAnswer={(verdict) => void handleAnswer(current, verdict)}
      />
    </div>
  );
}

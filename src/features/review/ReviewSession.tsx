import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { isUsableWord } from '@/db/isUsableWord';
import type { Word } from '@/db/word.type';
import { applyReviewOutcome } from '@/lib/applyReviewOutcome';
import { buildReviewQueue } from '@/lib/buildReviewQueue';
import { isDue } from '@/lib/isDue';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import type { TranslationKeys } from '@/lib/translationKeys.type';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { RecallCard } from '@/features/study/RecallCard';
import { ReviewSummary } from './ReviewSummary';

function sessionMeta(t: TranslationKeys, index: number, total: number, word: Word): string {
  const progress = t.reviewProgress(index + 1, total);
  return isDue(word, Date.now()) ? progress : `${progress} · ${t.aheadOfSchedule}`;
}

interface Counters {
  correct: number;
  almost: number;
  wrong: number;
}

const EMPTY_COUNTERS: Counters = { correct: 0, almost: 0, wrong: 0 };

export function ReviewSession() {
  const [queue, setQueue] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [counters, setCounters] = useState<Counters>(EMPTY_COUNTERS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const setScreen = useUIStore((s) => s.setScreen);
  const reviewLimit = useUIStore((s) => s.reviewLimit);
  const t = useTranslation();

  useEffect(() => {
    let cancelled = false;
    void db.words
      .where('stage')
      .equals('review')
      .toArray()
      .then((words) => {
        if (cancelled) return;
        setQueue(buildReviewQueue(words.filter(isUsableWord), Date.now(), reviewLimit));
        setIndex(0);
        setCounters(EMPTY_COUNTERS);
        setSaveFailed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reviewLimit]);

  async function handleAnswer(word: Word, verdict: MatchVerdict, accuracy: number, speedFactor: number) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const wordId = word.id;
    let persisted = true;
    if (wordId != null) {
      try {
        const next = applyReviewOutcome(word, verdict, accuracy, speedFactor, Date.now());
        const updatedCount = await db.words.update(wordId, next);
        persisted = updatedCount !== 0;
      } catch {
        persisted = false;
      }
    }
    if (persisted) {
      setCounters((c) => ({ ...c, [verdict]: c[verdict] + 1 }));
    }
    setSaveFailed(!persisted);
    setIndex((i) => i + 1);
    setIsSubmitting(false);
  }

  if (queue === null) {
    return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t.noReviewsYet}</p>
        <Button type="button" onClick={() => setScreen('newWords')}>
          {t.goToNewWords}
        </Button>
      </div>
    );
  }

  if (index >= queue.length) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-4">
        {saveFailed && (
          <p role="alert" className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
            {t.answerSaveError}
          </p>
        )}
        <ReviewSummary
          correct={counters.correct}
          almost={counters.almost}
          wrong={counters.wrong}
          onFinish={() => setScreen('newWords')}
        />
      </div>
    );
  }

  const current = queue[index];

  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <p className="text-right font-mono text-xs text-muted-foreground">
        {sessionMeta(t, index, queue.length, current)}
      </p>
      {saveFailed && (
        <p role="alert" className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
          {t.answerSaveError}
        </p>
      )}
      <RecallCard
        key={current.id}
        translation={current.translation}
        expectedTerm={current.term}
        onAnswer={(verdict, accuracy, speedFactor) => void handleAnswer(current, verdict, accuracy, speedFactor)}
      />
    </div>
  );
}

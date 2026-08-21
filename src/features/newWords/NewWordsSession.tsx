import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { isUsableWord } from '@/db/isUsableWord';
import type { Word } from '@/db/word.type';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import { DEFAULT_DIFFICULTY, INITIAL_STABILITY_DAYS } from '@/lib/memoryParams';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { RecognitionCard } from '@/features/study/RecognitionCard';
import { RecallCard } from '@/features/study/RecallCard';
import { NewWordsSummary } from './NewWordsSummary';

function pickRandomId(words: Word[], excludeId: number | null): number | null {
  if (words.length === 0) return null;
  const candidates = words.length > 1 && excludeId != null ? words.filter((w) => w.id !== excludeId) : words;
  const pickFrom = candidates.length > 0 ? candidates : words;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)].id ?? null;
}

export function NewWordsSession() {
  const [pool, setPool] = useState<Word[] | null>(null);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [turn, setTurn] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setScreen = useUIStore((s) => s.setScreen);
  const addWordOpen = useUIStore((s) => s.addWordOpen);
  const setAddWordOpen = useUIStore((s) => s.setAddWordOpen);
  const t = useTranslation();

  useEffect(() => {
    if (addWordOpen) return;

    let cancelled = false;
    void db.words
      .where('stage')
      .equals('new')
      .toArray()
      .then((rows) => {
        if (cancelled) return;
        const words = rows.filter(isUsableWord);
        setPool((previous) => {
          if (previous === null) return words;
          const alreadyInSession = new Set(previous.map((w) => w.id));
          const added = words.filter((w) => !alreadyInSession.has(w.id));
          return added.length > 0 ? [...previous, ...added] : previous;
        });
        setCurrentId((previousId) =>
          previousId != null && words.some((w) => w.id === previousId)
            ? previousId
            : pickRandomId(words, null),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [addWordOpen]);

  function advanceTo(nextPool: Word[], justShownId: number) {
    setPool(nextPool);
    setCurrentId(pickRandomId(nextPool, justShownId));
  }

  async function handleAnswer(word: Word, verdict: MatchVerdict) {
    const wordId = word.id;
    if (!pool || wordId == null || isSubmitting) return;
    setIsSubmitting(true);

    let updates: Partial<Word> | null = null;
    let graduated = false;

    if (verdict === 'correct') {
      const nextStreak = word.phaseStreak + 1;
      if (word.learningPhase === 'A' && nextStreak >= phaseARepeats) {
        updates = { learningPhase: 'B', phaseStreak: 0 };
      } else if (word.learningPhase === 'B' && nextStreak >= phaseBRepeats) {
        updates = {
          stage: 'review',
          stability: INITIAL_STABILITY_DAYS,
          difficulty: DEFAULT_DIFFICULTY,
          reviewStreak: 0,
          learningPhase: 'A',
          phaseStreak: 0,
          lastReviewedAt: Date.now(),
        };
        graduated = true;
      } else {
        updates = { phaseStreak: nextStreak };
      }
    } else if (verdict === 'wrong' && word.phaseStreak !== 0) {
      updates = { phaseStreak: 0 };
    }

    let updatedCount = 1;
    setSaveFailed(false);
    if (updates) {
      try {
        updatedCount = await db.words.update(wordId, updates);
      } catch {
        setSaveFailed(true);
        setTurn((t) => t + 1);
        setIsSubmitting(false);
        return;
      }
    }

    setTurn((t) => t + 1);
    setIsSubmitting(false);

    if (updatedCount === 0) {
      advanceTo(pool.filter((w) => w.id !== wordId), wordId);
      return;
    }

    if (graduated) {
      setLearnedCount((n) => n + 1);
      advanceTo(pool.filter((w) => w.id !== wordId), wordId);
      return;
    }

    const nextPool = updates ? pool.map((w) => (w.id === wordId ? { ...w, ...updates } : w)) : pool;
    advanceTo(nextPool, wordId);
  }

  if (pool === null) {
    return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  }

  if (pool.length === 0) {
    if (learnedCount > 0) {
      return <NewWordsSummary learnedCount={learnedCount} onFinish={() => setScreen('review')} />;
    }
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{t.noNewWords}</p>
        <Button type="button" onClick={() => setAddWordOpen(true)}>
          {t.addWordCta}
        </Button>
      </div>
    );
  }

  const current = pool.find((w) => w.id === currentId) ?? pool[0];

  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <p className="text-right font-mono text-xs text-muted-foreground">{t.remainingWords(pool.length)}</p>
      {saveFailed && (
        <p role="alert" className="rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
          {t.answerSaveError}
        </p>
      )}
      {current.learningPhase === 'A' ? (
        <RecognitionCard
          key={`${current.id}-A-${turn}`}
          term={current.term}
          translation={current.translation}
          currentStreak={current.phaseStreak}
          requiredStreak={phaseARepeats}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
        />
      ) : (
        <RecallCard
          key={`${current.id}-B-${turn}`}
          translation={current.translation}
          expectedTerm={current.term}
          currentStreak={current.phaseStreak}
          requiredStreak={phaseBRepeats}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
        />
      )}
    </div>
  );
}

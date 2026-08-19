import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { RecognitionCard } from '@/features/study/RecognitionCard';
import { RecallCard } from '@/features/study/RecallCard';
import { NewWordsSummary } from './NewWordsSummary';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function NewWordsSession() {
  const [pool, setPool] = useState<Word[] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [turn, setTurn] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setScreen = useUIStore((s) => s.setScreen);
  const addWordOpen = useUIStore((s) => s.addWordOpen);
  const setAddWordOpen = useUIStore((s) => s.setAddWordOpen);
  const t = useTranslation();

  const poolRef = useRef(pool);
  poolRef.current = pool;

  useEffect(() => {
    if (addWordOpen) return;
    if (poolRef.current !== null && poolRef.current.length > 0) return;

    let cancelled = false;
    void db.words
      .where('stage')
      .equals('new')
      .toArray()
      .then((words) => {
        if (!cancelled) setPool(shuffle(words));
      });
    return () => {
      cancelled = true;
    };
  }, [addWordOpen]);

  async function handleAnswer(word: Word, verdict: MatchVerdict) {
    const wordId = word.id;
    if (!pool || wordId == null || isSubmitting) return;
    setIsSubmitting(true);

    const advances = verdict === 'correct' || verdict === 'almost';
    const nextStreak = advances ? word.phaseStreak + 1 : 0;

    let updates: Partial<Word>;
    let graduated = false;

    if (!advances) {
      updates = { phaseStreak: 0 };
    } else if (word.learningPhase === 'A' && nextStreak >= phaseARepeats) {
      updates = { learningPhase: 'B', phaseStreak: 0 };
    } else if (word.learningPhase === 'B' && nextStreak >= phaseBRepeats) {
      updates = { stage: 'review', rating: 70, reviewStreak: 0, learningPhase: 'A', phaseStreak: 0, lastReviewedAt: Date.now() };
      graduated = true;
    } else {
      updates = { phaseStreak: nextStreak };
    }

    let updatedCount: number;
    try {
      updatedCount = await db.words.update(wordId, updates);
    } catch {
      setTurn((t) => t + 1);
      setIsSubmitting(false);
      return;
    }

    setTurn((t) => t + 1);
    setIsSubmitting(false);

    if (updatedCount === 0) {
      const remaining = pool.filter((w) => w.id !== wordId);
      setPool(remaining);
      setCursor((c) => (remaining.length > 0 ? c % remaining.length : 0));
      return;
    }

    if (graduated) {
      const remaining = pool.filter((w) => w.id !== wordId);
      setPool(remaining);
      setCursor((c) => (remaining.length > 0 ? c % remaining.length : 0));
      setLearnedCount((n) => n + 1);
    } else {
      setPool(pool.map((w) => (w.id === wordId ? { ...w, ...updates } : w)));
      setCursor((c) => (c + 1) % pool.length);
    }
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

  const current = pool[cursor % pool.length];

  return (
    <div className="flex flex-col gap-4">
      <p className="text-right font-mono text-xs text-muted-foreground">{t.remainingWords(pool.length)}</p>
      {current.learningPhase === 'A' ? (
        <RecognitionCard
          key={`${current.id}-A-${turn}`}
          term={current.term}
          translation={current.translation}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
        />
      ) : (
        <RecallCard
          key={`${current.id}-B-${turn}`}
          translation={current.translation}
          expectedTerm={current.term}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
        />
      )}
    </div>
  );
}

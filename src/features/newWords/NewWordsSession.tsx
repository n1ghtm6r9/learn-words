import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { StudyCardSkeleton } from '@/features/study/StudyCardSkeleton';
import { SessionProgress } from '@/features/study/SessionProgress';
import { sessionStepProgress } from '@/lib/sessionStepProgress';
import { useDb } from '@/db/useDb';
import { isUsableWord } from '@/db/isUsableWord';
import { deleteWordCascade } from '@/db/deleteWordCascade';
import type { Word } from '@/db/word.type';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import { DEFAULT_DIFFICULTY, INITIAL_STABILITY_DAYS } from '@/lib/memoryParams';
import { syncSessionPool } from '@/lib/syncSessionPool';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { RecognitionCard } from '@/features/study/RecognitionCard';
import { RecallCard } from '@/features/study/RecallCard';
import { StudyDeck } from '@/features/study/StudyDeck';
import { NewWordsEmptyState } from './NewWordsEmptyState';
import { NewWordsSummary } from './NewWordsSummary';

function pickRandomId(words: Word[], excludeId: string | null): string | null {
  if (words.length === 0) return null;
  const candidates = words.length > 1 && excludeId != null ? words.filter((w) => w.id !== excludeId) : words;
  const pickFrom = candidates.length > 0 ? candidates : words;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)].id ?? null;
}

export function NewWordsSession() {
  const db = useDb();
  const [pool, setPool] = useState<Word[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [turn, setTurn] = useState(0);
  const [learnedCount, setLearnedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const phaseARepeats = useUIStore((s) => s.phaseARepeats);
  const phaseBRepeats = useUIStore((s) => s.phaseBRepeats);
  const setScreen = useUIStore((s) => s.setScreen);
  const addWordOpen = useUIStore((s) => s.addWordOpen);
  const t = useTranslation();

  useEffect(() => {
    setPool(null);
    setCurrentId(null);
    setLearnedCount(0);
    setSaveFailed(false);
    setDeleteFailed(false);
  }, [db]);

  const stored = useLiveQuery(
    async () => ({ db, words: (await db.words.where('stage').equals('new').toArray()).filter(isUsableWord) }),
    [db],
  );
  const storedWords = stored?.db === db ? stored.words : undefined;

  useEffect(() => {
    if (addWordOpen || !storedWords) return;

    setPool((previous) => syncSessionPool(previous, storedWords));
    setCurrentId((previousId) =>
      previousId != null && storedWords.some((w) => w.id === previousId)
        ? previousId
        : pickRandomId(storedWords, null),
    );
  }, [storedWords, addWordOpen]);

  function advanceTo(nextPool: Word[], justShownId: string) {
    setPool(nextPool);
    setCurrentId(pickRandomId(nextPool, justShownId));
  }

  async function handleDelete(word: Word) {
    const wordId = word.id;
    if (!pool || wordId == null || isSubmitting) return;
    setIsSubmitting(true);

    try {
      await deleteWordCascade(db, wordId);
      setDeleteFailed(false);
      setTurn((n) => n + 1);
      advanceTo(pool.filter((w) => w.id !== wordId), wordId);
    } catch {
      setDeleteFailed(true);
    } finally {
      setIsSubmitting(false);
    }
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
    return <StudyCardSkeleton />;
  }

  if (pool.length === 0) {
    if (learnedCount > 0) {
      return (
        <div className="flex flex-1 flex-col justify-center md:mx-auto md:w-full md:max-w-xl">
          <NewWordsSummary learnedCount={learnedCount} onFinish={() => setScreen('review')} />
        </div>
      );
    }
    return <NewWordsEmptyState />;
  }

  const current = pool.find((w) => w.id === currentId) ?? pool[0];
  const sessionTotal = learnedCount + pool.length;
  const steps = sessionStepProgress(pool, learnedCount, phaseARepeats, phaseBRepeats);

  return (
    <div className="flex flex-1 flex-col justify-start gap-4 md:mx-auto md:w-full md:max-w-xl md:justify-center">
      <SessionProgress done={steps.done} total={steps.total} label={t.learnedProgress(learnedCount, sessionTotal)} />
      {saveFailed && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          {t.answerSaveError}
        </p>
      )}
      {deleteFailed && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
          {t.deleteError}
        </p>
      )}
      <StudyDeck remaining={pool.length} cardKey={`${current.id}-${current.learningPhase}-${turn}`}>
      {current.learningPhase === 'A' ? (
        <RecognitionCard
          key={`${current.id}-A-${turn}`}
          term={current.term}
          translation={current.translation}
          currentStreak={current.phaseStreak}
          requiredStreak={phaseARepeats}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
          onDelete={() => void handleDelete(current)}
        />
      ) : (
        <RecallCard
          key={`${current.id}-B-${turn}`}
          translation={current.translation}
          expectedTerm={current.term}
          currentStreak={current.phaseStreak}
          requiredStreak={phaseBRepeats}
          onAnswer={(verdict) => void handleAnswer(current, verdict)}
          onDelete={() => void handleDelete(current)}
        />
      )}
      </StudyDeck>
    </div>
  );
}

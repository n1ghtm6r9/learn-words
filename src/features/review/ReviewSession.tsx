import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Button } from '@/components/ui/button';
import { useDb } from '@/db/useDb';
import { isUsableWord } from '@/db/isUsableWord';
import type { Word } from '@/db/word.type';
import { applyReviewOutcome } from '@/lib/applyReviewOutcome';
import { buildReviewQueue } from '@/lib/buildReviewQueue';
import { filterWordsByScope } from '@/lib/filterWordsByScope';
import { folderCounts } from '@/lib/folderCounts';
import { isDue } from '@/lib/isDue';
import { tagCounts } from '@/lib/tagCounts';
import { tagsByWord } from '@/lib/tagsByWord';
import type { MatchVerdict } from '@/lib/fuzzyMatch';
import type { TranslationKeys } from '@/i18n/translationKeys.type';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { RecallCard } from '@/features/study/RecallCard';
import { ReviewFilters } from './ReviewFilters';
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
  const db = useDb();
  const [queue, setQueue] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [counters, setCounters] = useState<Counters>(EMPTY_COUNTERS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const setScreen = useUIStore((s) => s.setScreen);
  const reviewLimit = useUIStore((s) => s.reviewLimit);
  const folderFilter = useUIStore((s) => s.reviewFolderFilter);
  const setFolderFilter = useUIStore((s) => s.setReviewFolderFilter);
  const tagFilter = useUIStore((s) => s.reviewTagFilter);
  const setTagFilter = useUIStore((s) => s.setReviewTagFilter);
  const t = useTranslation();

  const snapshot = useLiveQuery(
    async () => ({
      db,
      folders: await db.folders.orderBy('order').toArray(),
      tags: await db.tags.orderBy('order').toArray(),
      reviewWords: (await db.words.where('stage').equals('review').toArray()).filter(isUsableWord),
      links: await db.wordTags.toArray(),
    }),
    [db],
  );
  const scope = snapshot?.db === db ? snapshot : undefined;
  const folders = useMemo(() => scope?.folders ?? [], [scope?.folders]);
  const tags = useMemo(() => scope?.tags ?? [], [scope?.tags]);
  const byFolder = useMemo(() => folderCounts(scope?.reviewWords ?? []), [scope?.reviewWords]);
  const byTag = useMemo(
    () => tagCounts(scope?.reviewWords ?? [], scope?.links ?? []),
    [scope?.reviewWords, scope?.links],
  );

  useEffect(() => {
    if (!scope) return;
    if (folderFilter !== 'all' && folderFilter !== null && !folders.some((folder) => folder.id === folderFilter)) {
      setFolderFilter('all');
    }
    const live = tagFilter.filter((id) => tags.some((tag) => tag.id === id));
    if (live.length !== tagFilter.length) setTagFilter(live);
  }, [scope, folders, tags, folderFilter, tagFilter, setFolderFilter, setTagFilter]);

  useEffect(() => {
    setQueue(null);
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([db.words.where('stage').equals('review').toArray(), db.wordTags.toArray()]).then(
      ([words, links]) => {
        if (cancelled) return;
        const inScope = filterWordsByScope(
          words.filter(isUsableWord),
          { folderId: folderFilter, tagIds: tagFilter },
          tagsByWord(links),
        );
        setQueue(buildReviewQueue(inScope, Date.now(), reviewLimit));
        setIndex(0);
        setCounters(EMPTY_COUNTERS);
        setSaveFailed(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [db, reviewLimit, folderFilter, tagFilter]);

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

  const scoped = folderFilter !== 'all' || tagFilter.length > 0;
  const showFilters = scope != null && (folders.length > 0 || tags.length > 0);

  function resetFilters() {
    setFolderFilter('all');
    setTagFilter([]);
  }

  function renderBody() {
    if (queue === null) {
      return <p className="text-sm text-muted-foreground">{t.loading}</p>;
    }

    if (queue.length === 0) {
      return scoped ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">{t.noReviewsInScope}</p>
          <Button type="button" variant="outline" onClick={resetFilters}>
            {t.resetFilters}
          </Button>
        </div>
      ) : (
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

  return (
    <div className="flex flex-1 flex-col gap-4">
      {showFilters && (
        <ReviewFilters
          db={db}
          folders={folders}
          tags={tags}
          folderCounts={byFolder}
          tagCounts={byTag}
          folderFilter={folderFilter}
          tagFilter={tagFilter}
          onFolderFilterChange={setFolderFilter}
          onTagFilterChange={setTagFilter}
        />
      )}
      {renderBody()}
    </div>
  );
}

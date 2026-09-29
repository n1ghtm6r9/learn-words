import { useLiveQuery } from 'dexie-react-hooks';
import { Layers } from 'lucide-react';
import { EmptyState } from '@/components/ui/emptyState';
import { useDb } from '@/db/useDb';
import { isUsableWord } from '@/db/isUsableWord';
import { isDue } from '@/lib/isDue';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { StatTile } from './StatTile';

export function NewWordsEmptyState() {
  const db = useDb();
  const setScreen = useUIStore((s) => s.setScreen);
  const setAddWordOpen = useUIStore((s) => s.setAddWordOpen);
  const t = useTranslation();

  const snapshot = useLiveQuery(async () => {
    const learned = (await db.words.where('stage').equals('review').toArray()).filter(isUsableWord);
    const now = Date.now();
    return { db, learned: learned.length, due: learned.filter((word) => isDue(word, now)).length };
  }, [db]);
  const stats = snapshot?.db === db ? snapshot : undefined;

  return (
    <EmptyState
      icon={Layers}
      message={t.noNewWords}
      action={{ label: t.addWordCta, onClick: () => setAddWordOpen(true) }}
      secondaryAction={stats && stats.due > 0 ? { label: t.startReview, onClick: () => setScreen('review') } : undefined}
    >
      {stats && stats.learned > 0 && (
        <dl className="grid w-full max-w-xs grid-cols-2 gap-2">
          <StatTile label={t.statLearnedWords} value={stats.learned} />
          <StatTile label={t.statDueNow} value={stats.due} />
        </dl>
      )}
    </EmptyState>
  );
}

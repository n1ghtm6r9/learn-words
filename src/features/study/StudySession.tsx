import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { selectDueWords } from '@/lib/srs';
import { useUIStore } from '@/store/useUIStore';
import { Flashcard } from './Flashcard';
import { SessionSummary } from './SessionSummary';

export function StudySession() {
  const words = useLiveQuery(() => db.words.toArray(), []);
  const session = useUIStore((s) => s.session);
  const startSession = useUIStore((s) => s.startSession);
  const endSession = useUIStore((s) => s.endSession);
  const setScreen = useUIStore((s) => s.setScreen);

  useEffect(() => {
    if (!session && words) {
      startSession(selectDueWords(words, Date.now()));
    }
  }, [session, words, startSession]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  if (!words || !session) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  if (session.queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <PartyPopper className="h-6 w-6 text-status-mastered" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">
          Сегодня повторять нечего — все слова уже выучены на сегодня.
        </p>
        <Button
          type="button"
          onClick={() => {
            endSession();
            setScreen('home');
          }}
        >
          На главную
        </Button>
      </div>
    );
  }

  if (session.index >= session.queue.length) {
    return (
      <SessionSummary
        session={session}
        onFinish={() => {
          endSession();
          setScreen('home');
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <p className="text-right font-mono text-xs text-muted-foreground">
          {session.index + 1} из {session.queue.length}
        </p>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((session.index + 1) / session.queue.length) * 100}%` }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>
      </div>
      <Flashcard key={session.queue[session.index].id} word={session.queue[session.index]} />
    </div>
  );
}

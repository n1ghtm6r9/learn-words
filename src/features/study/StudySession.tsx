import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
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

  if (!words || !session) {
    return <p>Загрузка...</p>;
  }

  if (session.queue.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <p>Сегодня повторять нечего — все слова уже выучены на сегодня.</p>
        <Button type="button" onClick={() => setScreen('home')}>
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
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {session.index + 1} из {session.queue.length}
      </p>
      <Flashcard word={session.queue[session.index]} />
    </div>
  );
}

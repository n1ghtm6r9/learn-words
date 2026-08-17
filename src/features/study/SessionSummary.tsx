import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { StudySessionState } from '@/store/studySessionState.type';

interface SessionSummaryProps {
  session: StudySessionState;
  onFinish: () => void;
}

const CONFETTI_COLORS = ['#3f7d70', '#c9a24a', '#f5f1e4', '#2f6b5e'];

export function SessionSummary({ session, onFinish }: SessionSummaryProps) {
  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
  }, []);

  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <PartyPopper className="h-7 w-7 text-status-mastered" aria-hidden="true" />
      <h2 className="text-lg font-semibold">Сессия завершена</h2>

      <div className="grid w-full grid-cols-3 gap-2 text-sm">
        <div className="flex flex-col items-center gap-1.5 rounded-md bg-secondary py-3">
          <span className="h-2 w-2 rounded-full bg-status-mastered" aria-hidden="true" />
          <p className="font-mono font-semibold">Верно: {session.correct}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-md bg-secondary py-3">
          <span className="h-2 w-2 rounded-full bg-status-learning" aria-hidden="true" />
          <p className="font-mono font-semibold">Почти: {session.almost}</p>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-md bg-secondary py-3">
          <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
          <p className="font-mono font-semibold">Неверно: {session.wrong}</p>
        </div>
      </div>

      <Button type="button" onClick={onFinish} className="w-full">
        На главную
      </Button>
    </Card>
  );
}

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import type { StudySessionState } from '@/store/useUIStore';

interface SessionSummaryProps {
  session: StudySessionState;
  onFinish: () => void;
}

export function SessionSummary({ session, onFinish }: SessionSummaryProps) {
  useEffect(() => {
    void confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-6 text-center">
      <h2 className="text-xl font-semibold">Сессия завершена</h2>
      <p>Верно: {session.correct}</p>
      <p>Почти: {session.almost}</p>
      <p>Неверно: {session.wrong}</p>
      <Button type="button" onClick={onFinish}>
        На главную
      </Button>
    </div>
  );
}

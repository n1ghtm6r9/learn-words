import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { confettiColors } from '@/lib/confettiColors';
import { useTranslation } from '@/lib/useTranslation';

interface ReviewSummaryProps {
  correct: number;
  almost: number;
  wrong: number;
  onFinish: () => void;
}

export function ReviewSummary({ correct, almost, wrong, onFinish }: ReviewSummaryProps) {
  const t = useTranslation();

  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: confettiColors() });
  }, []);

  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <PartyPopper className="h-7 w-7 text-status-mastered" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{t.reviewComplete}</h2>
      <div className="grid w-full grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-md bg-secondary px-1 py-3">
          <span className="sr-only">{t.reviewCorrectCount(correct)}</span>
          <span className="h-2 w-2 rounded-full bg-status-mastered" aria-hidden="true" />
          <p aria-hidden="true" className="font-mono text-lg leading-none font-semibold tabular-nums">{correct}</p>
          <p aria-hidden="true" className="text-xs text-muted-foreground">{t.statCorrect}</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-md bg-secondary px-1 py-3">
          <span className="sr-only">{t.reviewAlmostCount(almost)}</span>
          <span className="h-2 w-2 rounded-full bg-status-learning" aria-hidden="true" />
          <p aria-hidden="true" className="font-mono text-lg leading-none font-semibold tabular-nums">{almost}</p>
          <p aria-hidden="true" className="text-xs text-muted-foreground">{t.statAlmost}</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-md bg-secondary px-1 py-3">
          <span className="sr-only">{t.reviewWrongCount(wrong)}</span>
          <span className="h-2 w-2 rounded-full bg-destructive" aria-hidden="true" />
          <p aria-hidden="true" className="font-mono text-lg leading-none font-semibold tabular-nums">{wrong}</p>
          <p aria-hidden="true" className="text-xs text-muted-foreground">{t.statWrong}</p>
        </div>
      </div>
      <Button type="button" onClick={onFinish} className="w-full">
        {t.goToNewWords}
      </Button>
    </Card>
  );
}

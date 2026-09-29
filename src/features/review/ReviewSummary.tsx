import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { confettiColors } from '@/lib/confettiColors';
import { useTranslation } from '@/i18n/useTranslation';

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
    <Card className="flex flex-col items-center gap-5 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-mastered/15"><PartyPopper className="h-8 w-8 text-status-mastered" aria-hidden="true" /></span>
      <h2 className="text-2xl font-semibold tracking-tight">{t.reviewComplete}</h2>
      <div className="grid w-full grid-cols-3 gap-2">
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary px-1 py-4">
          <span className="sr-only">{t.reviewCorrectCount(correct)}</span>
          <span className="h-2.5 w-2.5 rounded-full bg-status-mastered" aria-hidden="true" />
          <p aria-hidden="true" className="font-mono text-2xl leading-none font-semibold tabular-nums">{correct}</p>
          <p aria-hidden="true" className="text-xs text-muted-foreground">{t.statCorrect}</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary px-1 py-4">
          <span className="sr-only">{t.reviewAlmostCount(almost)}</span>
          <span className="h-2.5 w-2.5 rounded-full bg-status-learning" aria-hidden="true" />
          <p aria-hidden="true" className="font-mono text-2xl leading-none font-semibold tabular-nums">{almost}</p>
          <p aria-hidden="true" className="text-xs text-muted-foreground">{t.statAlmost}</p>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary px-1 py-4">
          <span className="sr-only">{t.reviewWrongCount(wrong)}</span>
          <span className="h-2.5 w-2.5 rounded-full bg-destructive" aria-hidden="true" />
          <p aria-hidden="true" className="font-mono text-2xl leading-none font-semibold tabular-nums">{wrong}</p>
          <p aria-hidden="true" className="text-xs text-muted-foreground">{t.statWrong}</p>
        </div>
      </div>
      <Button type="button" size="lg" onClick={onFinish} className="w-full">
        {t.goToNewWords}
      </Button>
    </Card>
  );
}

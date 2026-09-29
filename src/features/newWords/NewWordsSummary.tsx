import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { confettiColors } from '@/lib/confettiColors';
import { useTranslation } from '@/i18n/useTranslation';

interface NewWordsSummaryProps {
  learnedCount: number;
  onFinish: () => void;
}

export function NewWordsSummary({ learnedCount, onFinish }: NewWordsSummaryProps) {
  const t = useTranslation();

  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: confettiColors() });
  }, []);

  return (
    <Card className="flex flex-col items-center gap-5 p-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-status-mastered/15"><PartyPopper className="h-8 w-8 text-status-mastered" aria-hidden="true" /></span>
      <h2 className="text-2xl font-semibold tracking-tight">{t.newWordsGraduated}</h2>
      <p className="font-mono text-sm text-muted-foreground">{t.learnedCount(learnedCount)}</p>
      <Button type="button" size="lg" onClick={onFinish} className="w-full">
        {t.done}
      </Button>
    </Card>
  );
}

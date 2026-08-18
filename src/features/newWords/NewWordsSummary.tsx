import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useTranslation } from '@/lib/useTranslation';

const CONFETTI_COLORS = ['#3f7d70', '#c9a24a', '#f5f1e4', '#2f6b5e'];

interface NewWordsSummaryProps {
  learnedCount: number;
  onFinish: () => void;
}

export function NewWordsSummary({ learnedCount, onFinish }: NewWordsSummaryProps) {
  const t = useTranslation();

  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: CONFETTI_COLORS });
  }, []);

  return (
    <Card className="flex flex-col items-center gap-4 p-6 text-center">
      <PartyPopper className="h-7 w-7 text-status-mastered" aria-hidden="true" />
      <h2 className="text-lg font-semibold">{t.newWordsGraduated}</h2>
      <p className="font-mono text-sm text-muted-foreground">{t.learnedCount(learnedCount)}</p>
      <Button type="button" onClick={onFinish} className="w-full">
        {t.done}
      </Button>
    </Card>
  );
}

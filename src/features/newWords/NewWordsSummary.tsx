import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountUpNumber } from '@/features/study/CountUpNumber';
import { confettiColors } from '@/lib/confettiColors';
import { playSound } from '@/lib/playSound';
import { useTranslation } from '@/i18n/useTranslation';

interface NewWordsSummaryProps {
  learnedCount: number;
  onFinish: () => void;
}

export function NewWordsSummary({ learnedCount, onFinish }: NewWordsSummaryProps) {
  const t = useTranslation();

  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: confettiColors() });
    playSound('finish');
  }, []);

  return (
    <Card className="flex flex-col items-center gap-5 p-8 text-center">
      <motion.span
        initial={{ scale: 0, rotate: -40 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 14, delay: 0.1 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-marker text-marker-foreground shadow-[0_12px_28px_-10px_var(--marker)]"
      >
        <PartyPopper className="h-9 w-9" aria-hidden="true" />
      </motion.span>
      <h2 className="font-display text-xl font-semibold text-balance">{t.newWordsGraduated}</h2>
      <div className="flex w-full flex-col items-center gap-1.5 rounded-2xl bg-secondary px-4 py-4">
        <span className="sr-only">{t.learnedCount(learnedCount)}</span>
        <p aria-hidden="true" className="font-display text-4xl leading-none font-semibold tabular-nums">
          <CountUpNumber value={learnedCount} delay={0.25} />
        </p>
        <p aria-hidden="true" className="text-xs text-muted-foreground">{t.statLearnedWords}</p>
      </div>
      <Button type="button" size="lg" onClick={onFinish} className="w-full">
        {t.done}
      </Button>
    </Card>
  );
}

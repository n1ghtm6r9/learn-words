import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'motion/react';
import { PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CountUpNumber } from '@/features/study/CountUpNumber';
import { ProgressBar } from '@/features/study/ProgressBar';
import { accuracyPercent } from '@/lib/accuracyPercent';
import { confettiColors } from '@/lib/confettiColors';
import { useTranslation } from '@/i18n/useTranslation';
import { ReviewStatTile } from './ReviewStatTile';

interface ReviewSummaryProps {
  correct: number;
  almost: number;
  wrong: number;
  onFinish: () => void;
}

const ACCURACY_DELAY_S = 0.45;

export function ReviewSummary({ correct, almost, wrong, onFinish }: ReviewSummaryProps) {
  const t = useTranslation();
  const answered = correct + almost + wrong;
  const accuracy = accuracyPercent(correct, answered);

  useEffect(() => {
    void confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors: confettiColors() });
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
      <h2 className="font-display text-xl font-semibold text-balance">{t.reviewComplete}</h2>
      <div className="grid w-full grid-cols-3 gap-2">
        <ReviewStatTile
          value={correct}
          label={t.statCorrect}
          srLabel={t.reviewCorrectCount(correct)}
          dotClassName="bg-status-mastered"
          delay={0.2}
        />
        <ReviewStatTile
          value={almost}
          label={t.statAlmost}
          srLabel={t.reviewAlmostCount(almost)}
          dotClassName="bg-status-learning"
          delay={0.3}
        />
        <ReviewStatTile
          value={wrong}
          label={t.statWrong}
          srLabel={t.reviewWrongCount(wrong)}
          dotClassName="bg-destructive"
          delay={0.4}
        />
      </div>
      {answered > 0 && (
        <div className="flex w-full flex-col gap-2">
          <div aria-hidden="true" className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{t.accuracyLabel}</span>
            <span className="font-display text-base font-semibold tabular-nums">
              <CountUpNumber value={accuracy} delay={ACCURACY_DELAY_S} />%
            </span>
          </div>
          <ProgressBar
            value={accuracy}
            max={100}
            label={t.accuracyLabel}
            valueText={`${accuracy}%`}
            delay={ACCURACY_DELAY_S}
            className="h-2"
            fillClassName="bg-status-mastered"
          />
        </div>
      )}
      <Button type="button" size="lg" onClick={onFinish} className="w-full">
        {t.goToNewWords}
      </Button>
    </Card>
  );
}

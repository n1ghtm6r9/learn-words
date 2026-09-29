import { motion } from 'motion/react';
import { useTranslation } from '@/i18n/useTranslation';

interface PhaseProgressDotsProps {
  current: number;
  total: number;
}

export function PhaseProgressDots({ current, total }: PhaseProgressDotsProps) {
  const t = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <span className="sr-only">{t.phaseProgress(current, total)}</span>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-border">
          <motion.span
            className="block h-full origin-left rounded-full bg-primary"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i < current ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.25 + i * 0.07 }}
          />
        </span>
      ))}
    </div>
  );
}

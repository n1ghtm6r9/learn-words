import { motion, useReducedMotion } from 'motion/react';
import { clamp } from '@/lib/clamp';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  valueText: string;
  delay?: number;
  className?: string;
  fillClassName?: string;
}

export function ProgressBar({ value, max, label, valueText, delay = 0, className, fillClassName }: ProgressBarProps) {
  const reduceMotion = useReducedMotion();
  const percent = max > 0 ? clamp((value * 100) / max, 0, 100) : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-border', className)}
    >
      <motion.div
        className={cn('h-full rounded-full bg-primary', fillClassName)}
        initial={reduceMotion ? false : { width: '0%' }}
        animate={{ width: `${percent}%` }}
        transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 26, delay }}
      />
    </div>
  );
}

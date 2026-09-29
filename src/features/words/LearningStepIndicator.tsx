import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';

const STEP_COUNT = 2;

interface LearningStepIndicatorProps {
  step: number;
}

export function LearningStepIndicator({ step }: LearningStepIndicatorProps) {
  const t = useTranslation();
  const label = t.newWordStepStatus(step);

  return (
    <span title={label} className="flex h-9 w-9 shrink-0 items-center justify-center gap-1">
      <span className="sr-only">{label}</span>
      {Array.from({ length: STEP_COUNT }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          data-state={index < step ? 'filled' : 'empty'}
          className={cn('h-1.5 w-2.5 rounded-full', index < step ? 'bg-primary/70' : 'bg-muted-foreground/20')}
        />
      ))}
    </span>
  );
}

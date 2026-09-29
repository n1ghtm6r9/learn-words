import { CountUpNumber } from '@/features/study/CountUpNumber';

interface ReviewStatTileProps {
  value: number;
  label: string;
  srLabel: string;
  dotClassName: string;
  delay: number;
}

export function ReviewStatTile({ value, label, srLabel, dotClassName, delay }: ReviewStatTileProps) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary px-1 py-4">
      <span className="sr-only">{srLabel}</span>
      <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} aria-hidden="true" />
      <p aria-hidden="true" className="font-display text-2xl leading-none font-semibold tabular-nums">
        <CountUpNumber value={value} delay={delay} />
      </p>
      <p aria-hidden="true" className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

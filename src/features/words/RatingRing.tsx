import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { RatingColor } from '@/lib/ratingColor.type';
import { RATING_STROKE_CLASS } from './ratingStrokeClass';

const SIZE = 36;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface RatingRingProps {
  rating: number;
  color: RatingColor;
  children?: ReactNode;
}

export function RatingRing({ rating, color, children }: RatingRingProps) {
  const fraction = Math.min(Math.max(rating, 0), 100) / 100;

  return (
    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center">
      <svg aria-hidden="true" viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 -rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-border"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={cn('transition-[stroke-dashoffset] duration-500', RATING_STROKE_CLASS[color])}
        />
      </svg>
      {children}
    </span>
  );
}

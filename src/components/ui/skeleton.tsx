import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn('animate-pulse rounded-xl bg-muted motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

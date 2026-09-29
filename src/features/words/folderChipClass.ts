import { cn } from '@/lib/utils';

export function folderChipClass(active: boolean, isTarget: boolean, wordDragging: boolean): string {
  return cn(
    'flex shrink-0 touch-manipulation select-none items-center min-h-10 gap-1.5 rounded-full border px-4 py-1.5 text-sm md:min-h-8 md:px-3 md:py-1 transition-colors',
    isTarget
      ? 'scale-105 border-primary bg-primary/20 text-foreground'
      : active
        ? 'border-primary bg-primary font-medium text-primary-foreground'
        : wordDragging
          ? 'border-dashed border-border text-muted-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-secondary',
  );
}

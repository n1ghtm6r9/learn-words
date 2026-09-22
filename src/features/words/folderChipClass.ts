import { cn } from '@/lib/utils';

export function folderChipClass(active: boolean, isTarget: boolean, wordDragging: boolean): string {
  return cn(
    'flex shrink-0 touch-manipulation select-none items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
    isTarget
      ? 'scale-105 border-primary bg-primary/20 text-foreground'
      : active
        ? 'border-primary bg-primary/10 text-foreground'
        : wordDragging
          ? 'border-dashed border-border text-muted-foreground'
          : 'border-border text-muted-foreground hover:bg-secondary',
  );
}

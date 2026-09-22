import { GripVertical } from 'lucide-react';
import type { Word } from '@/db/word.type';

export function WordDragPreview({ word }: { word: Word }) {
  return (
    <div className="flex cursor-grabbing items-center gap-2 rounded-lg border border-primary/40 bg-card px-3 py-2.5 shadow-xl ring-1 ring-primary/20">
      <span className="flex h-7 w-5 shrink-0 items-center justify-center text-foreground">
        <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[15px] font-medium">{word.term}</span>
        <span className="block truncate text-[13px] text-muted-foreground">{word.translation}</span>
      </span>
    </div>
  );
}

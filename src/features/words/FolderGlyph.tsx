import { Folder } from 'lucide-react';
import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_PALETTE } from '@/lib/labelPalette';
import { cn } from '@/lib/utils';

interface FolderGlyphProps {
  color: LabelColor;
  className?: string;
}

export function FolderGlyph({ color, className }: FolderGlyphProps) {
  return (
    <Folder
      aria-hidden="true"
      className={cn('h-3.5 w-3.5 shrink-0', className)}
      style={{ color: LABEL_PALETTE[color] }}
      fill="currentColor"
      fillOpacity={0.22}
      strokeWidth={2.2}
    />
  );
}

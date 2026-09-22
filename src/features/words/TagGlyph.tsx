import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_PALETTE } from '@/lib/labelPalette';
import { cn } from '@/lib/utils';

interface TagGlyphProps {
  color: LabelColor;
  className?: string;
}

export function TagGlyph({ color, className }: TagGlyphProps) {
  return (
    <span aria-hidden="true" className={cn('shrink-0 font-semibold', className)} style={{ color: LABEL_PALETTE[color] }}>
      #
    </span>
  );
}

import { Settings2 } from 'lucide-react';
import type { Tag } from '@/db/tag.type';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { TagGlyph } from './TagGlyph';

interface TagFilterProps {
  tags: Tag[];
  counts: Map<number, number>;
  selected: number[];
  onToggle: (tagId: number) => void;
}

export function TagFilter({ tags, counts, selected, onToggle }: TagFilterProps) {
  const setTagsOpen = useUIStore((s) => s.setTagsOpen);
  const t = useTranslation();

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => {
        const active = selected.includes(tag.id!);
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(tag.id!)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors',
              active
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:bg-secondary',
            )}
          >
            <TagGlyph color={tag.color} />
            {tag.name}
            <span className="font-mono text-[10px] opacity-70">{counts.get(tag.id!) ?? 0}</span>
          </button>
        );
      })}
      <button
        type="button"
        aria-label={t.manageTags}
        onClick={() => setTagsOpen(true)}
        className="flex shrink-0 items-center rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Settings2 className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

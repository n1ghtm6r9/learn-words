import { Settings2 } from 'lucide-react';
import type { Tag } from '@/db/tag.type';
import { useTranslation } from '@/i18n/useTranslation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useUIStore';
import { TagGlyph } from './TagGlyph';

interface TagFilterProps {
  tags: Tag[];
  counts: Map<string, number>;
  selected: string[];
  onToggle: (tagId: string) => void;
}

export function TagFilter({ tags, counts, selected, onToggle }: TagFilterProps) {
  const setTagsOpen = useUIStore((s) => s.setTagsOpen);
  const t = useTranslation();

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => {
        const active = selected.includes(tag.id!);
        return (
          <button
            key={tag.id}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(tag.id!)}
            className={cn(
              'flex shrink-0 items-center min-h-10 gap-1.5 rounded-full border px-4 py-1.5 text-sm md:min-h-8 md:px-3 md:py-1 transition-colors',
              active
                ? 'border-primary bg-primary/12 font-medium text-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary',
            )}
          >
            <TagGlyph color={tag.color} />
            {tag.name}
            <span className="font-mono text-xs opacity-70">{counts.get(tag.id!) ?? 0}</span>
          </button>
        );
      })}
      <button
        type="button"
        aria-label={t.manageTags}
        onClick={() => setTagsOpen(true)}
        className="flex min-h-10 min-w-10 md:min-h-8 md:min-w-8 shrink-0 items-center justify-center rounded-full border border-dashed border-border px-3 text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Settings2 className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

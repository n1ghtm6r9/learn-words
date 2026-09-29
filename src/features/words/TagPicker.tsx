import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/colorPicker';
import { FieldError } from '@/components/ui/fieldError';
import { Input } from '@/components/ui/input';
import type { Tag } from '@/db/tag.type';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_COLORS } from '@/lib/labelColors';
import { TagGlyph } from './TagGlyph';

interface TagPickerProps {
  tags: Tag[];
  selected: string[];
  onToggle: (tagId: string) => void;
  onCreate?: (name: string, color: LabelColor) => void;
}

export function TagPicker({ tags, selected, onToggle, onCreate }: TagPickerProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [color, setColor] = useState<LabelColor>('blue');
  const t = useTranslation();

  if (tags.length === 0 && !onCreate) return null;

  const name = normalizeTerm(draft ?? '');
  const isDuplicate = name !== '' && tags.some((tag) => tag.name.toLowerCase() === name.toLowerCase());

  function submit() {
    if (name === '' || isDuplicate || !onCreate) return;
    onCreate(name, color);
    setDraft(null);
  }

  return (
    <div className="flex flex-col gap-2 text-sm font-medium">
      {t.tagsLabel}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => {
          const active = selected.includes(tag.id!);
          return (
            <button
              key={tag.id}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(tag.id!)}
              className={cn(
                'flex min-h-10 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm md:min-h-8 md:px-3 md:py-1 transition-colors',
                active
                  ? 'border-transparent bg-marker font-medium text-marker-foreground'
                  : 'border-border bg-card text-muted-foreground hover:bg-secondary',
              )}
            >
              <TagGlyph color={tag.color} />
              {tag.name}
            </button>
          );
        })}

        {onCreate &&
          (draft === null ? (
            <button
              type="button"
              onClick={() => {
                setColor(LABEL_COLORS[tags.length % LABEL_COLORS.length]);
                setDraft('');
              }}
              className="flex min-h-10 items-center gap-1.5 rounded-full border border-dashed border-border px-4 py-1.5 md:min-h-8 md:px-3 md:py-1 text-sm text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              {t.newTag}
            </button>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={color}
                  label={t.labelColorsTitle}
                  colorLabel={t.labelColorName}
                  onChange={setColor}
                  glyph={(picked) => <TagGlyph color={picked} className="text-base leading-none" />}
                />
                <Input
                  autoFocus
                  aria-label={t.newTag}
                  placeholder={t.tagNamePlaceholder}
                  value={draft}
                  aria-invalid={isDuplicate || undefined}
                  maxLength={40}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submit();
                    }
                    if (e.key === 'Escape') setDraft(null);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label={t.cancel}
                  onClick={() => setDraft(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  aria-label={t.confirmCreate}
                  disabled={name === '' || isDuplicate}
                  onClick={submit}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
      </div>
      {isDuplicate && <FieldError>{t.duplicateTagName}</FieldError>}
    </div>
  );
}

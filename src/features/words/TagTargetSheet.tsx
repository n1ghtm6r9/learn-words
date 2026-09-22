import { BottomSheet } from '@/components/ui/bottomSheet';
import { SheetOption } from '@/components/ui/sheetOption';
import type { LabelColor } from '@/db/labelColor.type';
import type { Tag } from '@/db/tag.type';
import { LABEL_COLORS } from '@/lib/labelColors';
import { useTranslation } from '@/i18n/useTranslation';
import { AddEntryForm } from '@/features/organize/AddEntryForm';
import { TagGlyph } from './TagGlyph';

interface TagTargetSheetProps {
  mode: 'add' | 'remove';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  coverage: Map<number, number>;
  selectedCount: number;
  onPick: (tagId: number) => void;
  onCreate: (name: string, color: LabelColor) => void;
}

export function TagTargetSheet({
  mode,
  open,
  onOpenChange,
  tags,
  coverage,
  selectedCount,
  onPick,
  onCreate,
}: TagTargetSheetProps) {
  const t = useTranslation();
  const visible = mode === 'add' ? tags : tags.filter((tag) => (coverage.get(tag.id!) ?? 0) > 0);

  function hintFor(tagId: number): string | undefined {
    const have = coverage.get(tagId) ?? 0;
    if (mode === 'add' && have === selectedCount) return t.tagOnAll;
    return have > 0 ? t.tagOnSome(have, selectedCount) : undefined;
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={mode === 'add' ? t.addTagSheetTitle : t.removeTagSheetTitle}
    >
      {visible.length === 0 && mode === 'remove' && (
        <p className="px-3 py-4 text-center text-sm text-muted-foreground">{t.noTagsOnSelection}</p>
      )}
      {visible.map((tag) => (
        <SheetOption
          key={tag.id}
          icon={<TagGlyph color={tag.color} className="text-base leading-none" />}
          label={tag.name}
          hint={hintFor(tag.id!)}
          disabled={mode === 'add' && (coverage.get(tag.id!) ?? 0) === selectedCount}
          onClick={() => onPick(tag.id!)}
        />
      ))}
      {mode === 'add' && (
        <div className="mt-1 border-t border-border/70 pt-1">
          <AddEntryForm
            placeholder={t.tagNamePlaceholder}
            submitLabel={t.newTag}
            duplicateMessage={t.duplicateTagName}
            existingNames={tags.map((tag) => tag.name)}
            defaultColor={LABEL_COLORS[tags.length % LABEL_COLORS.length]}
            onAdd={onCreate}
            glyph={(color) => <TagGlyph color={color} className="text-base leading-none" />}
          />
        </div>
      )}
    </BottomSheet>
  );
}

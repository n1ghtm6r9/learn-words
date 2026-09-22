import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDb } from '@/db/useDb';
import { isUsableWord } from '@/db/isUsableWord';
import { appendTag } from '@/db/appendTag';
import { deleteTag } from '@/db/deleteTag';
import { writeOrder } from '@/db/writeOrder';
import { LABEL_COLORS } from '@/lib/labelColors';
import { CARD_CLASS } from '@/lib/cardClass';
import { tagCounts } from '@/lib/tagCounts';
import { useOptimisticOrder } from '@/lib/useOptimisticOrder';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { AddEntryForm } from './AddEntryForm';
import { OrganizeRow } from './OrganizeRow';
import { OrganizeRowPreview } from './OrganizeRowPreview';
import { SortableRows } from './SortableRows';
import { TagGlyph } from '@/features/words/TagGlyph';
import { useDragAwareOpenChange } from './useDragAwareOpenChange';

interface TagsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TagsDialog({ open, onOpenChange }: TagsDialogProps) {
  const db = useDb();
  const t = useTranslation();
  const { handleOpenChange, setDragging } = useDragAwareOpenChange(onOpenChange);

  const snapshot = useLiveQuery(
    async () => ({
      db,
      tags: await db.tags.orderBy('order').toArray(),
      words: await db.words.toArray(),
      links: await db.wordTags.toArray(),
    }),
    [db],
  );
  const data = snapshot?.db === db ? snapshot : undefined;
  const stored = useMemo(() => data?.tags ?? [], [data?.tags]);
  const [tags, setPendingOrder] = useOptimisticOrder(stored);
  const counts = useMemo(
    () => tagCounts((data?.words ?? []).filter(isUsableWord), data?.links ?? []),
    [data?.words, data?.links],
  );

  function reorder(orderedIds: number[]) {
    setPendingOrder(orderedIds);
    void writeOrder(db.tags, orderedIds);
  }

  function renderPreview(id: number) {
    const tag = tags.find((item) => item.id === id);
    if (!tag) return null;
    return (
      <OrganizeRowPreview name={tag.name} count={counts.get(id) ?? 0} marker={<TagGlyph color={tag.color} />} />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{t.tagsSectionTitle}</DialogTitle>
        <ul className={cn(CARD_CLASS, 'divide-y divide-border/70 overflow-hidden')}>
          <SortableRows ids={tags.map((tag) => tag.id!)} onReorder={reorder} renderPreview={renderPreview} onDraggingChange={setDragging}>
            {tags.map((tag) => (
              <OrganizeRow
                key={tag.id}
                id={tag.id!}
                name={tag.name}
                count={counts.get(tag.id!) ?? 0}
                marker={<TagGlyph color={tag.color} />}
                color={tag.color}
                onColorChange={(color) => void db.tags.update(tag.id!, { color })}
                renameLabel={t.renameTag}
                deleteLabel={t.deleteTag}
                confirmText={t.deleteTagConfirm(tag.name, counts.get(tag.id!) ?? 0)}
                onRename={(name) => void db.tags.update(tag.id!, { name })}
                onDelete={() => void deleteTag(db, tag.id!)}
              />
            ))}
          </SortableRows>
          {tags.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">{t.noTagsYet}</li>}
          <AddEntryForm
            placeholder={t.tagNamePlaceholder}
            submitLabel={t.newTag}
            duplicateMessage={t.duplicateTagName}
            existingNames={tags.map((tag) => tag.name)}
            defaultColor={LABEL_COLORS[tags.length % LABEL_COLORS.length]}
            onAdd={(name, color) => void appendTag(db, name, color)}
            glyph={(color) => <TagGlyph color={color} className="text-base leading-none" />}
          />
        </ul>
      </DialogContent>
    </Dialog>
  );
}

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useDb } from '@/db/useDb';
import { isUsableWord } from '@/db/isUsableWord';
import { appendFolder } from '@/db/appendFolder';
import { deleteFolder } from '@/db/deleteFolder';
import { writeOrder } from '@/db/writeOrder';
import { LABEL_COLORS } from '@/lib/labelColors';
import { CARD_CLASS } from '@/lib/cardClass';
import { folderCounts } from '@/lib/folderCounts';
import { useOptimisticOrder } from '@/lib/useOptimisticOrder';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { AddEntryForm } from './AddEntryForm';
import { OrganizeRow } from './OrganizeRow';
import { OrganizeRowPreview } from './OrganizeRowPreview';
import { SortableRows } from './SortableRows';
import { FolderGlyph } from '@/features/words/FolderGlyph';
import { useDragAwareOpenChange } from './useDragAwareOpenChange';

interface FoldersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FoldersDialog({ open, onOpenChange }: FoldersDialogProps) {
  const db = useDb();
  const t = useTranslation();
  const { handleOpenChange, setDragging } = useDragAwareOpenChange(onOpenChange);

  const snapshot = useLiveQuery(
    async () => ({
      db,
      folders: await db.folders.orderBy('order').toArray(),
      words: await db.words.toArray(),
    }),
    [db],
  );
  const data = snapshot?.db === db ? snapshot : undefined;
  const stored = useMemo(() => data?.folders ?? [], [data?.folders]);
  const [folders, setPendingOrder] = useOptimisticOrder(stored);
  const counts = useMemo(() => folderCounts((data?.words ?? []).filter(isUsableWord)), [data?.words]);

  function reorder(orderedIds: number[]) {
    setPendingOrder(orderedIds);
    void writeOrder(db.folders, orderedIds);
  }

  function renderPreview(id: number) {
    const folder = folders.find((f) => f.id === id);
    if (!folder) return null;
    return (
      <OrganizeRowPreview
        name={folder.name}
        count={counts.get(id) ?? 0}
        marker={<FolderGlyph color={folder.color} className="h-4 w-4" />}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogTitle>{t.foldersSectionTitle}</DialogTitle>
        <ul className={cn(CARD_CLASS, 'divide-y divide-border/70 overflow-hidden')}>
          <SortableRows ids={folders.map((f) => f.id!)} onReorder={reorder} renderPreview={renderPreview} onDraggingChange={setDragging}>
            {folders.map((folder) => (
              <OrganizeRow
                key={folder.id}
                id={folder.id!}
                name={folder.name}
                count={counts.get(folder.id!) ?? 0}
                marker={<FolderGlyph color={folder.color} className="h-4 w-4" />}
                color={folder.color}
                onColorChange={(color) => void db.folders.update(folder.id!, { color })}
                renameLabel={t.renameFolder}
                deleteLabel={t.deleteFolder}
                confirmText={t.deleteFolderConfirm(folder.name, counts.get(folder.id!) ?? 0)}
                onRename={(name) => void db.folders.update(folder.id!, { name })}
                onDelete={() => void deleteFolder(db, folder.id!)}
              />
            ))}
          </SortableRows>
          {folders.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">{t.noFoldersYet}</li>
          )}
          <AddEntryForm
            placeholder={t.folderNamePlaceholder}
            submitLabel={t.newFolder}
            duplicateMessage={t.duplicateFolderName}
            existingNames={folders.map((folder) => folder.name)}
            defaultColor={LABEL_COLORS[folders.length % LABEL_COLORS.length]}
            onAdd={(name, color) => void appendFolder(db, name, color)}
            glyph={(color) => <FolderGlyph color={color} className="h-4.5 w-4.5" />}
          />
        </ul>
      </DialogContent>
    </Dialog>
  );
}

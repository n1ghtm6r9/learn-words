import { FolderMinus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottomSheet';
import { SheetOption } from '@/components/ui/sheetOption';
import type { Folder } from '@/db/folder.type';
import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_COLORS } from '@/lib/labelColors';
import { useTranslation } from '@/i18n/useTranslation';
import { AddEntryForm } from '@/features/organize/AddEntryForm';
import { FolderGlyph } from './FolderGlyph';

interface FolderTargetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: Folder[];
  counts: Map<number | null, number>;
  sharedFolder: number | null | undefined;
  onPick: (folderId: number | null) => void;
  onCreate: (name: string, color: LabelColor) => void;
}

export function FolderTargetSheet({
  open,
  onOpenChange,
  folders,
  counts,
  sharedFolder,
  onPick,
  onCreate,
}: FolderTargetSheetProps) {
  const t = useTranslation();

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t.moveSheetTitle}>
      <SheetOption
        icon={<FolderMinus className="h-5 w-5 text-muted-foreground" aria-hidden="true" />}
        label={t.noFolder}
        hint={sharedFolder === null ? t.allHereAlready : String(counts.get(null) ?? 0)}
        disabled={sharedFolder === null}
        onClick={() => onPick(null)}
      />
      {folders.map((folder) => (
        <SheetOption
          key={folder.id}
          icon={<FolderGlyph color={folder.color} className="h-5 w-5" />}
          label={folder.name}
          hint={sharedFolder === folder.id ? t.allHereAlready : String(counts.get(folder.id!) ?? 0)}
          disabled={sharedFolder === folder.id}
          onClick={() => onPick(folder.id!)}
        />
      ))}
      <div className="mt-1 border-t border-border/70 pt-1">
        <AddEntryForm
          placeholder={t.folderNamePlaceholder}
          submitLabel={t.newFolder}
          duplicateMessage={t.duplicateFolderName}
          existingNames={folders.map((folder) => folder.name)}
          defaultColor={LABEL_COLORS[folders.length % LABEL_COLORS.length]}
          onAdd={onCreate}
          glyph={(color) => <FolderGlyph color={color} className="h-4.5 w-4.5" />}
        />
      </div>
    </BottomSheet>
  );
}

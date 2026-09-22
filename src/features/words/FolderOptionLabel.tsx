import { FolderMinus } from 'lucide-react';
import type { Folder } from '@/db/folder.type';
import { useTranslation } from '@/i18n/useTranslation';
import { FolderGlyph } from './FolderGlyph';

export function FolderOptionLabel({ folder }: { folder: Folder | null | undefined }) {
  const t = useTranslation();

  return (
    <span className="flex min-w-0 items-center gap-2">
      {folder ? (
        <FolderGlyph color={folder.color} className="h-4 w-4" />
      ) : (
        <FolderMinus aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 truncate">{folder ? folder.name : t.noFolder}</span>
    </span>
  );
}

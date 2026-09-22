import type { Folder } from '@/db/folder.type';
import { FolderGlyph } from './FolderGlyph';

interface FolderChipPreviewProps {
  folder: Folder;
  count: number;
}

export function FolderChipPreview({ folder, count }: FolderChipPreviewProps) {
  return (
    <div className="flex w-fit cursor-grabbing items-center gap-1.5 rounded-full border border-primary bg-card px-2.5 py-1 text-xs text-foreground shadow-xl ring-1 ring-primary/20">
      <FolderGlyph color={folder.color} />
      {folder.name}
      <span className="font-mono text-[10px] opacity-70">{count}</span>
    </div>
  );
}

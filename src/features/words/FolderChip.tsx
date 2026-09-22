import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Folder } from '@/db/folder.type';
import { cn } from '@/lib/utils';
import type { DragPayload } from './dragPayload.type';
import { folderChipClass } from './folderChipClass';
import { folderDragId } from './folderDragId';
import { FolderGlyph } from './FolderGlyph';

interface FolderChipProps {
  folder: Folder;
  count: number;
  active: boolean;
  wordDragging: boolean;
  onSelect: () => void;
}

export function FolderChip({ folder, count, active, wordDragging, onSelect }: FolderChipProps) {
  const payload: DragPayload = { type: 'folder', folderId: folder.id! };
  const { setNodeRef, attributes, listeners, transform, transition, isDragging, isOver } = useSortable({
    id: folderDragId(folder.id!),
    data: payload,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-drop-target={String(folder.id)}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        folderChipClass(active, wordDragging && isOver, wordDragging),
        'cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-30',
      )}
    >
      <FolderGlyph color={folder.color} />
      {folder.name}
      <span className="font-mono text-[10px] opacity-70">{count}</span>
    </button>
  );
}

import { useState } from 'react';
import { DndContext, MeasuringStrategy, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import type { Folder } from '@/db/folder.type';
import type { Tag } from '@/db/tag.type';
import type { VocabDB } from '@/db/VocabDB';
import { writeOrder } from '@/db/writeOrder';
import { useOptimisticOrder } from '@/lib/useOptimisticOrder';
import { useTouchFriendlySensors } from '@/lib/useTouchFriendlySensors';
import { DragOverlayPortal } from '@/components/dnd/DragOverlayPortal';
import type { DragPayload } from '@/features/words/dragPayload.type';
import { FolderBar } from '@/features/words/FolderBar';
import { FolderChipPreview } from '@/features/words/FolderChipPreview';
import { folderBarCollision } from '@/features/words/folderBarCollision';
import { TagFilter } from '@/features/words/TagFilter';

interface ReviewFiltersProps {
  db: VocabDB;
  folders: Folder[];
  tags: Tag[];
  folderCounts: Map<string | null, number>;
  tagCounts: Map<string, number>;
  folderFilter: string | null | 'all';
  tagFilter: string[];
  onFolderFilterChange: (value: string | null | 'all') => void;
  onTagFilterChange: (value: string[]) => void;
}

export function ReviewFilters({
  db,
  folders: storedFolders,
  tags,
  folderCounts,
  tagCounts,
  folderFilter,
  tagFilter,
  onFolderFilterChange,
  onTagFilterChange,
}: ReviewFiltersProps) {
  const [folders, setPendingOrder] = useOptimisticOrder(storedFolders);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const sensors = useTouchFriendlySensors();

  function handleDragStart(event: DragStartEvent) {
    const payload = event.active.data.current as DragPayload | undefined;
    setDraggedFolderId(payload?.type === 'folder' ? payload.folderId : null);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setDraggedFolderId(null);
    const dragged = active.data.current as DragPayload | undefined;
    const target = over?.data.current as DragPayload | undefined;
    if (dragged?.type !== 'folder' || target?.type !== 'folder' || dragged.folderId === target.folderId) return;
    const ids = folders.map((folder) => folder.id!);
    const next = arrayMove(ids, ids.indexOf(dragged.folderId), ids.indexOf(target.folderId));
    setPendingOrder(next);
    void writeOrder(db.folders, next);
  }

  const draggedFolder = folders.find((folder) => folder.id === draggedFolderId);
  const reviewableFolders = folders.filter(
    (folder) => (folderCounts.get(folder.id!) ?? 0) > 0 || folderFilter === folder.id,
  );
  const reviewableTags = tags.filter((tag) => (tagCounts.get(tag.id!) ?? 0) > 0 || tagFilter.includes(tag.id!));

  if (reviewableFolders.length === 0 && reviewableTags.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <DndContext
        sensors={sensors}
        collisionDetection={folderBarCollision}
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggedFolderId(null)}
      >
        {reviewableFolders.length > 0 && (
          <FolderBar
            folders={reviewableFolders}
            counts={folderCounts}
            value={folderFilter}
            wordDragging={false}
            manageable={false}
            hideEmptyRoot
            onChange={onFolderFilterChange}
          />
        )}
        <DragOverlayPortal>
          {draggedFolder ? (
            <FolderChipPreview folder={draggedFolder} count={folderCounts.get(draggedFolder.id!) ?? 0} />
          ) : null}
        </DragOverlayPortal>
      </DndContext>

      <TagFilter
        tags={reviewableTags}
        counts={tagCounts}
        selected={tagFilter}
        manageable={false}
        onToggle={(tagId) =>
          onTagFilterChange(tagFilter.includes(tagId) ? tagFilter.filter((id) => id !== tagId) : [...tagFilter, tagId])
        }
      />
    </div>
  );
}

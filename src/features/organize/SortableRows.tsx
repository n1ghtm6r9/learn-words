import { useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useHandleSensors } from '@/lib/useHandleSensors';
import { DragOverlayPortal } from '@/components/dnd/DragOverlayPortal';

interface SortableRowsProps {
  ids: string[];
  onReorder: (orderedIds: string[]) => void;
  renderPreview: (id: string) => React.ReactNode;
  onDraggingChange?: (dragging: boolean) => void;
  children: React.ReactNode;
}

export function SortableRows({ ids, onReorder, renderPreview, onDraggingChange, children }: SortableRowsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useHandleSensors();

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    onDraggingChange?.(true);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    onDraggingChange?.(false);
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        onDraggingChange?.(false);
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlayPortal>{activeId != null ? renderPreview(activeId) : null}</DragOverlayPortal>
    </DndContext>
  );
}

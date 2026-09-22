import { useState } from 'react';
import { DndContext, closestCenter, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useHandleSensors } from '@/lib/useHandleSensors';
import { DragOverlayPortal } from '@/components/dnd/DragOverlayPortal';

interface SortableRowsProps {
  ids: number[];
  onReorder: (orderedIds: number[]) => void;
  renderPreview: (id: number) => React.ReactNode;
  onDraggingChange?: (dragging: boolean) => void;
  children: React.ReactNode;
}

export function SortableRows({ ids, onReorder, renderPreview, onDraggingChange, children }: SortableRowsProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const sensors = useHandleSensors();

  function handleDragStart(event: DragStartEvent) {
    setActiveId(Number(event.active.id));
    onDraggingChange?.(true);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    onDraggingChange?.(false);
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(Number(active.id));
    const to = ids.indexOf(Number(over.id));
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

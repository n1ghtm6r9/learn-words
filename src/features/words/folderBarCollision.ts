import { closestCenter, pointerWithin, type CollisionDetection } from '@dnd-kit/core';
import type { DragPayload } from './dragPayload.type';

export const folderBarCollision: CollisionDetection = (args) => {
  const active = args.active.data.current as DragPayload | undefined;
  const payloadOf = (data: unknown) => data as DragPayload | undefined;

  if (active?.type === 'word') {
    const targets = args.droppableContainers.filter((container) => {
      const type = payloadOf(container.data.current)?.type;
      return type === 'folder' || type === 'root';
    });
    return pointerWithin({ ...args, droppableContainers: targets });
  }

  const folders = args.droppableContainers.filter(
    (container) => payloadOf(container.data.current)?.type === 'folder',
  );
  const underPointer = pointerWithin({ ...args, droppableContainers: folders });
  return underPointer.length > 0 ? underPointer : closestCenter({ ...args, droppableContainers: folders });
};

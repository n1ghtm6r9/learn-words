import { useDraggable } from '@dnd-kit/core';
import type { ComponentProps } from 'react';
import type { DragPayload } from './dragPayload.type';
import { WordItem } from './WordItem';
import { wordDragId } from './wordDragId';

type DraggableWordItemProps = Omit<ComponentProps<typeof WordItem>, 'rowRef' | 'dragHandle' | 'dragging'>;

export function DraggableWordItem(props: DraggableWordItemProps) {
  const wordId = props.word.id!;
  const payload: DragPayload = { type: 'word', wordId };
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: wordDragId(wordId),
    data: payload,
    disabled: props.selectable,
  });

  return (
    <WordItem
      {...props}
      rowRef={setNodeRef}
      dragging={isDragging}
      dragHandle={{ ref: setActivatorNodeRef, props: { ...attributes, ...listeners } }}
    />
  );
}

import { useDroppable } from '@dnd-kit/core';
import { FolderMinus } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import type { DragPayload } from './dragPayload.type';
import { folderChipClass } from './folderChipClass';
import { ROOT_DROP_ID } from './rootDropId';

interface RootChipProps {
  count: number;
  active: boolean;
  wordDragging: boolean;
  onSelect: () => void;
}

const PAYLOAD: DragPayload = { type: 'root' };

export function RootChip({ count, active, wordDragging, onSelect }: RootChipProps) {
  const { setNodeRef, isOver } = useDroppable({ id: ROOT_DROP_ID, data: PAYLOAD });
  const t = useTranslation();

  return (
    <button
      ref={setNodeRef}
      type="button"
      data-drop-target="root"
      onClick={onSelect}
      className={folderChipClass(active, wordDragging && isOver, wordDragging)}
    >
      <FolderMinus className="h-3 w-3" aria-hidden="true" />
      {t.noFolder}
      <span className="font-mono text-[10px] opacity-70">{count}</span>
    </button>
  );
}

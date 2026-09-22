import { useMemo, useRef } from 'react';
import { SortableContext } from '@dnd-kit/sortable';
import { Settings2 } from 'lucide-react';
import type { Folder } from '@/db/folder.type';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n/useTranslation';
import { useUIStore } from '@/store/useUIStore';
import { FolderChip } from './FolderChip';
import { RootChip } from './RootChip';
import { createFlowSortingStrategy } from './createFlowSortingStrategy';
import { folderChipClass } from './folderChipClass';
import { folderDragId } from './folderDragId';

const CHIP_GAP_PX = 6;

interface FolderBarProps {
  folders: Folder[];
  counts: Map<number | null, number>;
  value: number | null | 'all';
  wordDragging: boolean;
  onChange: (value: number | null | 'all') => void;
}

export function FolderBar({ folders, counts, value, wordDragging, onChange }: FolderBarProps) {
  const setFoldersOpen = useUIStore((s) => s.setFoldersOpen);
  const t = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const strategy = useMemo(
    () =>
      createFlowSortingStrategy(() => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        const style = getComputedStyle(container);
        return {
          left: rect.left + parseFloat(style.paddingLeft),
          right: rect.right - parseFloat(style.paddingRight),
        };
      }, CHIP_GAP_PX),
    [],
  );

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-wrap gap-1.5',
        wordDragging &&
          'sticky top-14 z-30 -mx-1 rounded-lg border border-primary/40 bg-card/95 p-1.5 shadow-lg backdrop-blur',
      )}
    >
      {!wordDragging && (
        <button type="button" onClick={() => onChange('all')} className={folderChipClass(value === 'all', false, false)}>
          {t.allFolders}
        </button>
      )}

      <RootChip
        count={counts.get(null) ?? 0}
        active={value === null}
        wordDragging={wordDragging}
        onSelect={() => onChange(null)}
      />

      <SortableContext items={folders.map((folder) => folderDragId(folder.id!))} strategy={strategy}>
        {folders.map((folder) => (
          <FolderChip
            key={folder.id}
            folder={folder}
            count={counts.get(folder.id!) ?? 0}
            active={value === folder.id}
            wordDragging={wordDragging}
            onSelect={() => onChange(folder.id!)}
          />
        ))}
      </SortableContext>

      {!wordDragging && (
        <button
          type="button"
          aria-label={t.manageFolders}
          onClick={() => setFoldersOpen(true)}
          className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
        >
          <Settings2 className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

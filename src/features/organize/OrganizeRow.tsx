import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/colorPicker';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/useTranslation';
import type { LabelColor } from '@/db/labelColor.type';
import { cn } from '@/lib/utils';

interface OrganizeRowProps {
  id: number;
  name: string;
  count: number;
  marker: React.ReactNode;
  color: LabelColor;
  onColorChange: (color: LabelColor) => void;
  renameLabel: string;
  deleteLabel: string;
  confirmText: string;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export function OrganizeRow({
  id,
  name,
  count,
  marker,
  color,
  onColorChange,
  renameLabel,
  deleteLabel,
  confirmText,
  onRename,
  onDelete,
}: OrganizeRowProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [draftColor, setDraftColor] = useState<LabelColor>(color);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const t = useTranslation();
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id,
    disabled: draft !== null || confirmingDelete,
  });

  const style = { transform: CSS.Translate.toString(transform), transition };

  function startEditing() {
    setDraftColor(color);
    setDraft(name);
  }

  function commit() {
    const next = (draft ?? '').trim();
    if (next && next !== name) onRename(next);
    if (draftColor !== color) onColorChange(draftColor);
    setDraft(null);
  }

  if (draft !== null) {
    return (
      <li ref={setNodeRef} style={style} className="flex flex-col gap-2 bg-card px-3 py-2">
        <div className="flex items-center gap-2">
          <ColorPicker value={draftColor} label={t.labelColorsTitle} colorLabel={t.labelColorName} onChange={setDraftColor} />
          <Input
          autoFocus
          aria-label={renameLabel}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setDraft(null);
          }}
        />
        </div>
        <div className="flex items-center justify-end gap-2">
          <div className="flex shrink-0 items-center gap-1.5">
            <Button type="button" variant="outline" size="sm" onClick={() => setDraft(null)}>
              {t.cancel}
            </Button>
            <Button type="button" size="sm" onClick={commit}>
              {t.save}
            </Button>
          </div>
        </div>
      </li>
    );
  }

  if (confirmingDelete) {
    return (
      <li ref={setNodeRef} style={style} className="flex flex-col gap-2 bg-destructive/5 px-3 py-2.5">
        <p role="alert" className="flex items-start gap-2 text-sm">
          {marker}
          <span>{confirmText}</span>
        </p>
        <div className="flex items-center justify-end gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
            {t.cancel}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onDelete} autoFocus>
            {t.delete}
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      data-reorder-id={id}
      className={cn(
        'relative flex items-center gap-2 bg-card px-3 py-2',
        isDragging && 'z-10 bg-secondary/60 [&>*]:opacity-30',
      )}
    >
      <span
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t.reorderHandle(name)}
        className="flex h-7 w-5 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {marker}
        <span className="min-w-0 truncate text-sm">{name}</span>
        <span className="shrink-0 font-mono text-xs text-muted-foreground">{count}</span>
      </span>

      <span className="flex shrink-0 items-center">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={renameLabel}
          onClick={startEditing}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={deleteLabel}
          onClick={() => setConfirmingDelete(true)}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </span>
    </li>
  );
}

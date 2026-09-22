import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/colorPicker';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Folder } from '@/db/folder.type';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { useTranslation } from '@/i18n/useTranslation';
import type { LabelColor } from '@/db/labelColor.type';
import { LABEL_COLORS } from '@/lib/labelColors';
import { FolderGlyph } from './FolderGlyph';
import { FolderOptionLabel } from './FolderOptionLabel';

interface FolderPickerProps {
  folders: Folder[];
  value: number | null;
  onChange: (folderId: number | null) => void;
  onCreate?: (name: string, color: LabelColor) => void;
}

export function FolderPicker({ folders, value, onChange, onCreate }: FolderPickerProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [color, setColor] = useState<LabelColor>('blue');
  const t = useTranslation();

  const name = normalizeTerm(draft ?? '');
  const isDuplicate = name !== '' && folders.some((folder) => folder.name.toLowerCase() === name.toLowerCase());
  const current = value == null ? null : folders.find((f) => f.id === value);

  function submit() {
    if (name === '' || isDuplicate || !onCreate) return;
    onCreate(name, color);
    setDraft(null);
  }

  return (
    <div className="flex flex-col gap-1.5 text-sm">
      {t.folderLabel}

      {draft === null ? (
        <div className="flex flex-col gap-1.5">
          <Select<number | null> value={value} onValueChange={(next) => onChange(next)}>
            <SelectTrigger aria-label={t.folderLabel}>
              <SelectValue>{() => <FolderOptionLabel folder={current} />}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>
                <FolderOptionLabel folder={null} />
              </SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.id} value={folder.id!}>
                  <FolderOptionLabel folder={folder} />
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {onCreate && (
            <button
              type="button"
              onClick={() => {
                setColor(LABEL_COLORS[folders.length % LABEL_COLORS.length]);
                setDraft('');
              }}
              className="flex w-fit items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-secondary"
            >
              <Plus className="h-2.5 w-2.5" aria-hidden="true" />
              {t.newFolder}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <ColorPicker
              value={color}
              label={t.labelColorsTitle}
              colorLabel={t.labelColorName}
              onChange={setColor}
              glyph={(picked) => <FolderGlyph color={picked} className="h-4.5 w-4.5" />}
            />
            <Input
              autoFocus
              aria-label={t.newFolder}
              placeholder={t.folderNamePlaceholder}
              value={draft}
              maxLength={40}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
                if (e.key === 'Escape') setDraft(null);
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={t.cancel}
              onClick={() => setDraft(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              aria-label={t.confirmCreate}
              disabled={name === '' || isDuplicate}
              onClick={submit}
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
          {isDuplicate && <p className="text-xs text-destructive">{t.duplicateFolderName}</p>}
        </div>
      )}
    </div>
  );
}

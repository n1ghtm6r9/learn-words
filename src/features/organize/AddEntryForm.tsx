import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/colorPicker';
import { Input } from '@/components/ui/input';
import type { LabelColor } from '@/db/labelColor.type';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { useTranslation } from '@/i18n/useTranslation';

interface AddEntryFormProps {
  placeholder: string;
  submitLabel: string;
  duplicateMessage: string;
  existingNames: string[];
  defaultColor: LabelColor;
  onAdd: (name: string, color: LabelColor) => void;
  glyph?: (color: LabelColor) => React.ReactNode;
}

export function AddEntryForm({
  placeholder,
  submitLabel,
  duplicateMessage,
  existingNames,
  defaultColor,
  onAdd,
  glyph,
}: AddEntryFormProps) {
  const [value, setValue] = useState('');
  const [picked, setPicked] = useState<LabelColor | null>(null);
  const t = useTranslation();

  const color = picked ?? defaultColor;
  const name = normalizeTerm(value);
  const isDuplicate = name !== '' && existingNames.some((taken) => taken.toLowerCase() === name.toLowerCase());

  function submit() {
    if (name === '' || isDuplicate) return;
    onAdd(name, color);
    setValue('');
    setPicked(null);
  }

  return (
    <div className="flex flex-col gap-1 px-3 py-2">
      <div className="flex items-center gap-2">
        <ColorPicker value={color} label={t.labelColorsTitle} colorLabel={t.labelColorName} onChange={setPicked} glyph={glyph} />
        <Input
          aria-label={placeholder}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={submitLabel}
          disabled={name === '' || isDuplicate}
          onClick={submit}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {isDuplicate && <p className="text-xs text-destructive">{duplicateMessage}</p>}
    </div>
  );
}

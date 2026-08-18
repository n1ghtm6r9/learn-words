import { useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import { parseWordLines } from '@/lib/parseWordLines';
import { useTranslation } from '@/lib/useTranslation';

interface BulkAddFormProps {
  onDone: () => void;
}

export function BulkAddForm({ onDone }: BulkAddFormProps) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const t = useTranslation();

  const { valid, invalidLines } = useMemo(() => parseWordLines(text), [text]);

  async function handleSaveAll() {
    if (valid.length === 0 || isSaving) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      await db.words.bulkAdd(valid.map((line) => createWord(line.term, line.translation)));
      onDone();
    } catch {
      setSaveError(true);
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        {t.wordListLabel}
        <textarea
          aria-label={t.wordListLabel}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={'hello - привет\ncat - кот'}
          className="w-full rounded-lg border border-input bg-transparent p-2.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      {valid.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {valid.map((line, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1.5 text-sm">
              <span className="font-mono font-medium">{line.term}</span>
              <span className="text-muted-foreground">—</span>
              <span className="text-muted-foreground">{line.translation}</span>
            </li>
          ))}
        </ul>
      )}

      {invalidLines.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {invalidLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {t.parseErrorPrefix} <span className="font-mono">{line}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {saveError && (
        <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.bulkSaveError}
        </p>
      )}

      <Button type="button" onClick={() => void handleSaveAll()} disabled={valid.length === 0 || isSaving}>
        {t.saveAll}
      </Button>
    </div>
  );
}

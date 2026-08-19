import { useMemo, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import { isUsableWord } from '@/db/isUsableWord';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { parseWordLines } from '@/lib/parseWordLines';
import type { ParsedWordLine } from '@/lib/parsedWordLine.type';
import { useTranslation } from '@/lib/useTranslation';

interface BulkAddFormProps {
  onDone: () => void;
}

function dedupeByTerm(lines: ParsedWordLine[]): { unique: ParsedWordLine[]; duplicateCount: number } {
  const seen = new Set<string>();
  const unique: ParsedWordLine[] = [];
  let duplicateCount = 0;

  for (const line of lines) {
    const key = line.term.toLowerCase();
    if (seen.has(key)) {
      duplicateCount += 1;
      continue;
    }
    seen.add(key);
    unique.push(line);
  }

  return { unique, duplicateCount };
}

export function BulkAddForm({ onDone }: BulkAddFormProps) {
  const [text, setText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const t = useTranslation();

  const { invalidLines, valid, duplicateCount } = useMemo(() => {
    const parsed = parseWordLines(text);
    const { unique, duplicateCount } = dedupeByTerm(parsed.valid);
    return { invalidLines: parsed.invalidLines, valid: unique, duplicateCount };
  }, [text]);

  async function handleSaveAll() {
    if (valid.length === 0 || isSaving) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      const existing = new Set(
        (await db.words.toArray()).filter(isUsableWord).map((w) => normalizeTerm(w.term).toLowerCase()),
      );
      const toSave = valid
        .map((line) => createWord(line.term, line.translation))
        .filter((word) => !existing.has(word.term.toLowerCase()));
      if (toSave.length > 0) {
        await db.words.bulkAdd(toSave);
      }
      onDone();
    } catch {
      setSaveError(true);
    } finally {
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
          placeholder={t.wordListPlaceholder}
          className="w-full rounded-lg border border-input bg-transparent p-2.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      {valid.length > 0 && (
        <ul className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
          {valid.map((line, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-1.5 text-sm">
              <span className="min-w-0 shrink truncate font-mono font-medium">{line.term}</span>
              <span className="shrink-0 text-muted-foreground">—</span>
              <span className="min-w-0 shrink truncate text-muted-foreground">{line.translation}</span>
            </li>
          ))}
        </ul>
      )}

      {duplicateCount > 0 && (
        <p className="flex items-start gap-2 rounded-md bg-status-learning/10 px-2.5 py-1.5 text-sm text-status-learning">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.bulkDuplicatesSkipped(duplicateCount)}
        </p>
      )}

      {invalidLines.length > 0 && (
        <ul className="flex max-h-32 flex-col gap-1.5 overflow-y-auto">
          {invalidLines.map((line, i) => (
            <li key={i} className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">
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

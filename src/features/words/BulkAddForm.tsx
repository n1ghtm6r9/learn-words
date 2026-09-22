import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDb } from '@/db/useDb';
import { createWord } from '@/db/createWord';
import { appendTag } from '@/db/appendTag';
import { appendFolder } from '@/db/appendFolder';
import { isUsableWord } from '@/db/isUsableWord';
import { FolderPicker } from './FolderPicker';
import { TagPicker } from './TagPicker';
import { duplicateKey } from '@/lib/duplicateKey';
import { parseWordLines } from '@/lib/parseWordLines';
import type { ParsedWordLine } from '@/lib/parsedWordLine.type';
import { useTranslation } from '@/i18n/useTranslation';
import type { StudyLanguage } from '@/languages/studyLanguage.type';
import { useUIStore } from '@/store/useUIStore';

interface BulkAddFormProps {
  onDone: () => void;
}

function dedupeByTerm(
  lines: ParsedWordLine[],
  language: StudyLanguage,
): { unique: ParsedWordLine[]; duplicateCount: number } {
  const seen = new Set<string>();
  const unique: ParsedWordLine[] = [];
  let duplicateCount = 0;

  for (const line of lines) {
    const key = duplicateKey(line.term, language);
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
  const db = useDb();
  const studyLanguage = useUIStore((s) => s.studyLanguage);
  const setLastUsedFolderId = useUIStore((s) => s.setLastUsedFolderId);
  const [text, setText] = useState('');
  const [folderId, setFolderId] = useState<number | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const t = useTranslation();

  const snapshot = useLiveQuery(
    async () => ({
      db,
      folders: await db.folders.orderBy('order').toArray(),
      tags: await db.tags.orderBy('order').toArray(),
    }),
    [db],
  );
  const data = snapshot?.db === db ? snapshot : undefined;

  const { invalidLines, valid, duplicateCount } = useMemo(() => {
    const parsed = parseWordLines(text);
    const { unique, duplicateCount } = dedupeByTerm(parsed.valid, studyLanguage);
    return { invalidLines: parsed.invalidLines, valid: unique, duplicateCount };
  }, [text, studyLanguage]);

  async function handleSaveAll() {
    if (valid.length === 0 || isSaving) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      const existing = new Set(
        (await db.words.toArray()).filter(isUsableWord).map((w) => duplicateKey(w.term, studyLanguage)),
      );
      const toSave = valid
        .map((line) => createWord(line.term, line.translation, studyLanguage))
        .filter((word) => !existing.has(duplicateKey(word.term, studyLanguage)))
        .map((word) => (folderId == null ? word : { ...word, folderId }));
      if (toSave.length > 0) {
        await db.transaction('rw', db.words, db.wordTags, async () => {
          const ids = await db.words.bulkAdd(toSave, { allKeys: true });
          if (tagIds.length > 0) {
            await db.wordTags.bulkAdd(ids.flatMap((wordId) => tagIds.map((tagId) => ({ wordId, tagId }))));
          }
        });
      }
      setLastUsedFolderId(folderId);
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
          placeholder={t.wordListPlaceholder(studyLanguage)}
          className="w-full rounded-lg border border-input bg-transparent p-2.5 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <FolderPicker
        folders={data?.folders ?? []}
        value={folderId}
        onChange={setFolderId}
        onCreate={(name, color) => void appendFolder(db, name, color).then(setFolderId)}
      />

      <TagPicker
        tags={data?.tags ?? []}
        selected={tagIds}
        onToggle={(tagId) =>
          setTagIds((current) =>
            current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId],
          )
        }
        onCreate={(name, color) =>
          void appendTag(db, name, color).then((tagId) => setTagIds((current) => [...current, tagId]))
        }
      />

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

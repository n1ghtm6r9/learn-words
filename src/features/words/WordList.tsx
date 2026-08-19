import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import { useTranslation } from '@/lib/useTranslation';
import { ExportDialog } from './ExportDialog';
import { ImportDialog } from './ImportDialog';
import { WordForm } from './WordForm';
import { WordItem } from './WordItem';

export function WordList() {
  const words = useLiveQuery(() => db.words.toArray(), []);
  const [search, setSearch] = useState('');
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const t = useTranslation();

  const sorted = useMemo(
    () => [...(words ?? [])].sort((a, b) => a.term.localeCompare(b.term)),
    [words],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sorted;
    return sorted.filter(
      (w) => w.term.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query),
    );
  }, [sorted, search]);

  async function handleDelete(id?: number) {
    if (id == null) return;
    try {
      await db.words.delete(id);
      setDeleteError(false);
    } catch {
      setDeleteError(true);
    }
  }

  if (!words) {
    return <p className="text-sm text-muted-foreground">{t.loading}</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input placeholder={t.searchPlaceholder} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setExportOpen(true)}>
          {t.exportButtonLabel}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setImportOpen(true)}>
          {t.importButtonLabel}
        </Button>
      </div>

      {deleteError && (
        <p className="flex items-start gap-2 rounded-md bg-destructive/10 px-2.5 py-1.5 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.deleteError}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {words.length === 0 ? t.noWordsYet : t.nothingFound}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((word) => (
            <WordItem
              key={word.id}
              word={word}
              onEdit={() => setEditingWord(word)}
              onDelete={() => void handleDelete(word.id)}
            />
          ))}
        </ul>
      )}

      <Dialog open={editingWord != null} onOpenChange={(open) => !open && setEditingWord(null)}>
        <DialogContent>
          <DialogTitle>{t.editWordDialogTitle}</DialogTitle>
          {editingWord && (
            <WordForm mode="edit" word={editingWord} onDone={() => setEditingWord(null)} />
          )}
        </DialogContent>
      </Dialog>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

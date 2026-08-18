import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/db/db';
import type { Word } from '@/db/word.type';
import { WordForm } from './WordForm';
import { WordItem } from './WordItem';

export function WordList() {
  const words = useLiveQuery(() => db.words.toArray(), []);
  const [search, setSearch] = useState('');
  const [editingWord, setEditingWord] = useState<Word | null>(null);

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
    await db.words.delete(id);
  }

  if (!words) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {words.length === 0 ? 'Слов пока нет.' : 'Ничего не найдено.'}
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
          <DialogTitle>Изменить слово</DialogTitle>
          {editingWord && (
            <WordForm mode="edit" word={editingWord} onDone={() => setEditingWord(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { db, type Word } from '@/db/db';
import { WordForm } from './WordForm';
import { WordItem } from './WordItem';

export function WordList() {
  const words = useLiveQuery(() => db.words.orderBy('term').toArray(), []) ?? [];
  const [search, setSearch] = useState('');
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return words;
    return words.filter(
      (w) => w.term.toLowerCase().includes(query) || w.translation.toLowerCase().includes(query),
    );
  }, [words, search]);

  async function handleDelete(id?: number) {
    if (id == null) return;
    await db.words.delete(id);
  }

  return (
    <div className="flex flex-col gap-3">
      <Input
        placeholder="Поиск..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Слов пока нет.</p>
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

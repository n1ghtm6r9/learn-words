import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createWord, db, type Word } from '@/db/db';

export interface WordFormProps {
  mode: 'create' | 'edit';
  word?: Word;
  onDone: () => void;
}

export function WordForm({ mode, word, onDone }: WordFormProps) {
  const [term, setTerm] = useState(word?.term ?? '');
  const [translation, setTranslation] = useState(word?.translation ?? '');
  const [category, setCategory] = useState(word?.category ?? '');
  const [duplicate, setDuplicate] = useState(false);

  async function checkDuplicate(value: string) {
    if (mode === 'edit' || value.trim() === '') {
      setDuplicate(false);
      return;
    }
    const count = await db.words.where('term').equalsIgnoreCase(value.trim()).count();
    setDuplicate(count > 0);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (mode === 'edit' && word?.id != null) {
      await db.words.update(word.id, {
        term: term.trim(),
        translation: translation.trim(),
        category: category.trim() || undefined,
      });
    } else {
      await db.words.add(createWord(term.trim(), translation.trim(), category.trim() || undefined));
    }

    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Слово
        <Input
          aria-label="Слово"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            void checkDuplicate(e.target.value);
          }}
          required
        />
      </label>

      {duplicate && (
        <p className="text-sm text-amber-600">Такое слово уже есть в словаре — сохранить второй раз?</p>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Перевод
        <Input
          aria-label="Перевод"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Категория (необязательно)
        <Input
          aria-label="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </label>

      <Button type="submit">Сохранить</Button>
    </form>
  );
}

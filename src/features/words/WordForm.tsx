import { useEffect, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import type { Word } from '@/db/word.type';
import { useTranslation } from '@/lib/useTranslation';

const DUPLICATE_CHECK_DEBOUNCE_MS = 300;

export interface WordFormProps {
  mode: 'create' | 'edit';
  word?: Word;
  onDone: () => void;
}

export function WordForm({ mode, word, onDone }: WordFormProps) {
  const [term, setTerm] = useState(word?.term ?? '');
  const [translation, setTranslation] = useState(word?.translation ?? '');
  const [duplicate, setDuplicate] = useState(false);
  const duplicateRequestId = useRef(0);
  const duplicateTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t = useTranslation();

  useEffect(() => {
    return () => clearTimeout(duplicateTimeout.current);
  }, []);

  async function checkDuplicate(value: string) {
    const requestId = ++duplicateRequestId.current;
    const count = await db.words.where('term').equalsIgnoreCase(value.trim()).count();
    if (requestId === duplicateRequestId.current) {
      setDuplicate(count > 0);
    }
  }

  function scheduleDuplicateCheck(value: string) {
    clearTimeout(duplicateTimeout.current);
    duplicateRequestId.current += 1;

    if (mode === 'edit' || value.trim() === '') {
      setDuplicate(false);
      return;
    }

    duplicateTimeout.current = setTimeout(() => {
      void checkDuplicate(value);
    }, DUPLICATE_CHECK_DEBOUNCE_MS);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!term.trim() || !translation.trim()) return;

    if (mode === 'edit' && word?.id != null) {
      await db.words.update(word.id, {
        term: term.trim(),
        translation: translation.trim(),
      });
    } else {
      await db.words.add(createWord(term.trim(), translation.trim()));
    }

    onDone();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        {t.wordInputLabel}
        <Input
          aria-label={t.wordInputLabel}
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            scheduleDuplicateCheck(e.target.value);
          }}
          required
          className="font-mono"
        />
      </label>

      {duplicate && (
        <p className="flex items-start gap-2 rounded-md bg-status-learning/10 p-2.5 text-sm text-status-learning">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.duplicateWarning}
        </p>
      )}

      <label className="flex flex-col gap-1.5 text-sm">
        {t.translationInputLabel}
        <Input
          aria-label={t.translationInputLabel}
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
          className="font-mono"
        />
      </label>

      <Button type="submit">{t.save}</Button>
    </form>
  );
}

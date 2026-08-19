import { useEffect, useRef, useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import { isUsableWord } from '@/db/isUsableWord';
import type { Word } from '@/db/word.type';
import { detectWordKind } from '@/lib/detectWordKind';
import { normalizeTerm } from '@/lib/normalizeTerm';
import { useTranslation } from '@/lib/useTranslation';

const DUPLICATE_CHECK_DEBOUNCE_MS = 300;
const HAS_MEANINGFUL_CHARACTER = /[\p{L}\p{N}]/u;

export interface WordFormProps {
  mode: 'create' | 'edit';
  word?: Word;
  onDone: () => void;
}

export function WordForm({ mode, word, onDone }: WordFormProps) {
  const [term, setTerm] = useState(word?.term ?? '');
  const [translation, setTranslation] = useState(word?.translation ?? '');
  const [duplicate, setDuplicate] = useState(false);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const duplicateRequestId = useRef(0);
  const duplicateTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t = useTranslation();

  useEffect(() => {
    return () => clearTimeout(duplicateTimeout.current);
  }, []);

  async function countExistingCollisions(value: string): Promise<number> {
    const needle = value.toLowerCase();
    return db.words
      .filter((w) => w.id !== word?.id && isUsableWord(w) && w.term.toLowerCase() === needle)
      .count();
  }

  async function checkDuplicate(value: string) {
    const requestId = ++duplicateRequestId.current;
    try {
      const count = await countExistingCollisions(normalizeTerm(value));
      if (requestId === duplicateRequestId.current) {
        setDuplicate(count > 0);
      }
    } catch {
      if (requestId === duplicateRequestId.current) {
        setDuplicate(false);
      }
    }
  }

  function scheduleDuplicateCheck(value: string) {
    clearTimeout(duplicateTimeout.current);
    duplicateRequestId.current += 1;
    setInvalid(false);
    setSaveError(false);

    if (value.trim() === '') {
      setDuplicate(false);
      return;
    }

    duplicateTimeout.current = setTimeout(() => {
      void checkDuplicate(value);
    }, DUPLICATE_CHECK_DEBOUNCE_MS);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isSaving) return;

    const trimmedTerm = normalizeTerm(term);
    const trimmedTranslation = normalizeTerm(translation);

    if (!HAS_MEANINGFUL_CHARACTER.test(trimmedTerm) || !trimmedTranslation) {
      setInvalid(true);
      return;
    }
    setInvalid(false);

    setIsSaving(true);
    setSaveError(false);
    try {
      if (duplicateConfirmed !== trimmedTerm) {
        const collisions = await countExistingCollisions(trimmedTerm);
        if (collisions > 0) {
          setDuplicate(true);
          setDuplicateConfirmed(trimmedTerm);
          return;
        }
      }

      if (mode === 'edit' && word?.id != null) {
        await db.words.update(word.id, {
          term: trimmedTerm,
          translation: trimmedTranslation,
          kind: detectWordKind(trimmedTerm),
        });
      } else {
        await db.words.add(createWord(trimmedTerm, trimmedTranslation));
      }

      onDone();
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        {t.wordInputLabel}
        <Input
          aria-label={t.wordInputLabel}
          value={term}
          maxLength={200}
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
          maxLength={200}
          onChange={(e) => {
            setTranslation(e.target.value);
            setInvalid(false);
            setSaveError(false);
          }}
          required
          className="font-mono"
        />
      </label>

      {invalid && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.wordFormInvalid}
        </p>
      )}

      {saveError && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-destructive/10 p-2.5 text-sm text-destructive">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {t.wordFormSaveError}
        </p>
      )}

      <Button type="submit" disabled={isSaving}>
        {duplicate ? t.saveAnyway : t.save}
      </Button>
    </form>
  );
}

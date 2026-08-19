import { useState } from 'react';
import { Pencil, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Word } from '@/db/word.type';
import { effectiveRating } from '@/lib/effectiveRating';
import { ratingColor } from '@/lib/ratingColor';
import { RATING_DOT_CLASS } from '@/lib/ratingDotClass';
import { RATING_TEXT_CLASS } from '@/lib/ratingTextClass';
import { isSpeechSupported, speak } from '@/lib/tts';
import { useTranslation } from '@/lib/useTranslation';

interface WordItemProps {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
  onOpenDetails: () => void;
}

export function WordItem({ word, onEdit, onDelete, onOpenDetails }: WordItemProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const t = useTranslation();

  const isLearning = word.stage === 'new';
  const rating = isLearning ? null : effectiveRating(word, Date.now());
  const color = rating == null ? null : ratingColor(rating);

  return (
    <li className="flex items-center gap-2 px-3 py-2.5">
      <button
        type="button"
        aria-label={`${t.openWordDetails}: ${word.term}`}
        onClick={onOpenDetails}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left transition-colors hover:bg-secondary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span className="flex w-8 shrink-0 flex-col items-center gap-1">
          <span
            aria-hidden="true"
            className={cn(
              'h-2 w-2 rounded-full',
              color ? RATING_DOT_CLASS[color] : 'border-[1.5px] border-muted-foreground/60',
            )}
          />
          {rating == null ? (
            <span className="sr-only">{t.newWordStepStatus(word.learningPhase === 'A' ? 1 : 2)}</span>
          ) : (
            <>
              <span className="sr-only">{t.ratingSrLabel}</span>
              <span className={cn('font-mono text-[10px] leading-none', RATING_TEXT_CLASS[color!])}>
                {Math.round(rating)}
              </span>
            </>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-1.5">
            <span className="min-w-0 truncate font-mono text-[15px] font-medium">{word.term}</span>
            {word.kind === 'phrase' && (
              <span className="shrink-0 text-[10px] text-muted-foreground/70">{t.phraseTag}</span>
            )}
          </span>
          <span className="block truncate text-[13px] text-muted-foreground">{word.translation}</span>
        </span>
      </button>

      {confirmingDelete ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <span role="alert" className="sr-only">
            {t.confirmDelete}
          </span>
          <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
            {t.cancel}
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={onDelete} autoFocus>
            {t.delete}
          </Button>
        </div>
      ) : (
        <div className="flex shrink-0 items-center">
          {isSpeechSupported() && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.speak}
              onClick={() => speak(word.term)}
              className="text-muted-foreground hover:text-primary"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t.edit}
            onClick={onEdit}
            className="text-muted-foreground hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t.delete}
            onClick={() => setConfirmingDelete(true)}
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
}

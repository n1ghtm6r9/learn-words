import { useState } from 'react';
import { Pencil, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CARD_CLASS } from '@/lib/cardClass';
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

  const badge =
    word.stage === 'new' ? (
      <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className={cn('h-1.5 w-1.5 rounded-full', word.learningPhase === 'B' ? 'bg-primary' : 'bg-border')} />
        </span>
        <span className="sr-only">{t.newWordStepStatus(word.learningPhase === 'A' ? 1 : 2)}</span>
        {t.learningBadge}
      </span>
    ) : (
      (() => {
        const rating = effectiveRating(word, Date.now());
        const color = ratingColor(rating);
        return (
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className={cn('h-2 w-2 rounded-full', RATING_DOT_CLASS[color])} aria-hidden="true" />
            <span className="sr-only">{t.ratingSrLabel}</span>
            <span className={cn('font-mono font-medium', RATING_TEXT_CLASS[color])}>{rating.toFixed(2)}</span>
          </span>
        );
      })()
    );

  return (
    <li className={cn(CARD_CLASS, 'flex items-center justify-between gap-3 p-3')}>
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          aria-label={`${t.openWordDetails}: ${word.term}`}
          onClick={onOpenDetails}
          className="flex min-w-0 items-center gap-3 rounded-md text-left transition-colors hover:bg-secondary/60 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {badge}
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="min-w-0 truncate font-mono font-medium">{word.term}</span>
              {word.kind === 'phrase' && (
                <span className="shrink-0 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {t.phraseTag}
                </span>
              )}
            </span>
            <span className="block truncate text-sm text-muted-foreground">{word.translation}</span>
          </span>
        </button>
        {isSpeechSupported() && (
          <button
            type="button"
            aria-label={t.speak}
            onClick={() => speak(word.term)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
          >
            <Volume2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {confirmingDelete ? (
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span role="alert" className="text-xs text-muted-foreground">
            {t.confirmDelete}
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
              {t.cancel}
            </Button>
            <Button type="button" variant="destructive" size="sm" onClick={onDelete} autoFocus>
              {t.delete}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 gap-1">
          <Button type="button" variant="ghost" size="icon-sm" aria-label={t.edit} onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t.delete}
            onClick={() => setConfirmingDelete(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </li>
  );
}

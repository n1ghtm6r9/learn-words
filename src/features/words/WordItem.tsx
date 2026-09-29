import { useState } from 'react';
import { Check, GripVertical, Pencil, Trash2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Tag } from '@/db/tag.type';
import type { LabelColor } from '@/db/labelColor.type';
import type { Word } from '@/db/word.type';
import { effectiveRating } from '@/lib/effectiveRating';
import { ratingColor } from '@/lib/ratingColor';
import { RATING_TEXT_CLASS } from '@/lib/ratingTextClass';
import { isSpeechSupported } from '@/lib/tts';
import { useSpeak } from '@/lib/useSpeak';
import { useTranslation } from '@/i18n/useTranslation';
import { FolderGlyph } from './FolderGlyph';
import { LearningStepIndicator } from './LearningStepIndicator';
import { RatingRing } from './RatingRing';
import { SwipeableRow } from './SwipeableRow';
import { TagGlyph } from './TagGlyph';
import { useCoarsePointer } from './useCoarsePointer';

interface WordItemProps {
  word: Word;
  folder?: { name: string; color: LabelColor };
  tags?: Tag[];
  selectable?: boolean;
  selected?: boolean;
  dragging?: boolean;
  rowRef?: (element: HTMLLIElement | null) => void;
  dragHandle?: {
    ref: (element: HTMLElement | null) => void;
    props: React.HTMLAttributes<HTMLElement>;
  };
  onToggleSelected?: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenDetails: () => void;
}

export function WordItem({
  word,
  folder,
  tags,
  selectable = false,
  selected = false,
  dragging = false,
  rowRef,
  dragHandle,
  onToggleSelected,
  onEdit,
  onDelete,
  onOpenDetails,
}: WordItemProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const t = useTranslation();
  const speak = useSpeak();
  const coarsePointer = useCoarsePointer();
  const speechSupported = isSpeechSupported();
  const swipeEnabled = coarsePointer && !selectable && !dragging && !confirmingDelete;

  const isLearning = word.stage === 'new';
  const rating = isLearning ? null : effectiveRating(word, Date.now());
  const color = rating == null ? null : ratingColor(rating);

  return (
    <li
      ref={rowRef}
      className={cn(
        'group/row relative overflow-hidden bg-card transition-colors',
        dragging && 'bg-[color-mix(in_oklab,var(--secondary)_60%,var(--card))]',
        selectable && selected && 'bg-[color-mix(in_oklab,var(--primary)_12%,var(--card))]',
      )}
    >
      <SwipeableRow
        enabled={swipeEnabled}
        canSpeak={speechSupported}
        onSwipeLeft={onDelete}
        onSwipeRight={() => speak(word.term)}
        className={cn('flex items-center gap-2 px-3.5 py-3.5 md:py-2.5', dragging && '[&>*]:opacity-30')}
      >
        {dragHandle && !selectable && (
          <span
            ref={dragHandle.ref}
            data-no-swipe=""
            {...dragHandle.props}
            aria-label={`${t.moveToFolder} ${word.term}`}
            className="flex h-10 w-6 shrink-0 cursor-grab touch-none items-center justify-center rounded text-muted-foreground/60 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
        {selectable && (
          <button
            type="button"
            role="checkbox"
            aria-checked={selected}
            aria-label={word.term}
            onClick={onToggleSelected}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all',
              selected
                ? 'scale-100 border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground/35 hover:border-primary/60',
            )}
          >
            {selected && <Check className="h-3.5 w-3.5 animate-in zoom-in-50 duration-150" strokeWidth={3} aria-hidden="true" />}
          </button>
        )}
        <button
          type="button"
          aria-label={`${t.openWordDetails}: ${word.term}`}
          onClick={selectable ? onToggleSelected : onOpenDetails}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left transition-colors hover:bg-secondary/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          {rating == null || color == null ? (
            <LearningStepIndicator step={word.learningPhase === 'A' ? 1 : 2} />
          ) : (
            <RatingRing rating={rating} color={color}>
              <span className="sr-only">{t.ratingSrLabel}</span>
              <span className={cn('relative text-xs leading-none font-semibold tabular-nums', RATING_TEXT_CLASS[color])}>
                {Math.round(rating)}
              </span>
            </RatingRing>
          )}

          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <span className="min-w-0 truncate font-mono text-base font-semibold">{word.term}</span>
              {word.kind === 'phrase' && (
                <span className="shrink-0 text-xs text-muted-foreground/80">{t.phraseTag}</span>
              )}
            </span>
            <span className="block truncate text-sm text-muted-foreground">{word.translation}</span>
            {(folder || (tags && tags.length > 0)) && (
              <span className="mt-1 flex items-center gap-3 overflow-hidden">
                {folder && (
                  <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground/90">
                    <FolderGlyph color={folder.color} className="h-3.5 w-3.5" />
                    {folder.name}
                  </span>
                )}
                {tags?.map((tag) => (
                  <span
                    key={tag.id}
                    className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground/90"
                  >
                    <TagGlyph color={tag.color} />
                    {tag.name}
                  </span>
                ))}
              </span>
            )}
          </span>
        </button>

        {selectable ? null : confirmingDelete ? (
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
          <div className="flex shrink-0 items-center transition-opacity duration-150 [@media(hover:hover)]:md:opacity-0 [@media(hover:hover)]:md:group-hover/row:opacity-100 [@media(hover:hover)]:md:group-focus-within/row:opacity-100">
            {speechSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t.speak}
                onClick={() => speak(word.term)}
                className="text-muted-foreground hover:text-primary"
              >
                <Volume2 />
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
              <Pencil />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t.delete}
              onClick={() => setConfirmingDelete(true)}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </div>
        )}
      </SwipeableRow>
    </li>
  );
}

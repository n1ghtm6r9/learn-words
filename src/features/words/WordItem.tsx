import { Button } from '@/components/ui/button';
import { CARD_CLASS } from '@/lib/cardClass';
import { cn } from '@/lib/utils';
import type { Word } from '@/db/word.type';
import { effectiveRating } from '@/lib/effectiveRating';
import { ratingColor } from '@/lib/ratingColor';
import { RATING_DOT_CLASS } from '@/lib/ratingDotClass';
import { RATING_TEXT_CLASS } from '@/lib/ratingTextClass';

interface WordItemProps {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
}

export function WordItem({ word, onEdit, onDelete }: WordItemProps) {
  const badge =
    word.stage === 'new' ? (
      <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-0.5" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className={cn('h-1.5 w-1.5 rounded-full', word.learningPhase === 'B' ? 'bg-primary' : 'bg-border')} />
        </span>
        <span className="sr-only">
          Учится, шаг {word.learningPhase === 'A' ? 1 : 2} из 2
        </span>
        Учится
      </span>
    ) : (
      (() => {
        const rating = effectiveRating(word, Date.now());
        const color = ratingColor(rating);
        return (
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className={cn('h-2 w-2 rounded-full', RATING_DOT_CLASS[color])} aria-hidden="true" />
            <span className="sr-only">Рейтинг</span>
            <span className={cn('font-mono font-medium', RATING_TEXT_CLASS[color])}>{rating}</span>
          </span>
        );
      })()
    );

  return (
    <li className={cn(CARD_CLASS, 'flex items-center justify-between p-3')}>
      <div className="flex items-center gap-3">
        {badge}
        <div>
          <p className="font-mono font-medium">{word.term}</p>
          <p className="text-sm text-muted-foreground">{word.translation}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>
          Изменить
        </Button>
        <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
          Удалить
        </Button>
      </div>
    </li>
  );
}

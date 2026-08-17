import { Button } from '@/components/ui/button';
import { CARD_CLASS } from '@/lib/cardClass';
import { cn } from '@/lib/utils';
import type { Word } from '@/db/db';
import { masteryStatus } from '@/lib/mastery';
import { MASTERY_LABEL } from '@/lib/masteryLabel';
import { STATUS_DOT_CLASS } from '@/lib/statusDotClass';

interface WordItemProps {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
}

export function WordItem({ word, onEdit, onDelete }: WordItemProps) {
  const status = masteryStatus(word.interval);

  return (
    <li className={cn(CARD_CLASS, 'flex items-center justify-between p-3')}>
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`}
          title={MASTERY_LABEL[status]}
          aria-hidden="true"
        />
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

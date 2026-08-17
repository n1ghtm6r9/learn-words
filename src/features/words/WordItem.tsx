import { Button } from '@/components/ui/button';
import type { Word } from '@/db/db';

interface WordItemProps {
  word: Word;
  onEdit: () => void;
  onDelete: () => void;
}

export function WordItem({ word, onEdit, onDelete }: WordItemProps) {
  return (
    <li className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="font-medium">{word.term}</p>
        <p className="text-sm text-muted-foreground">{word.translation}</p>
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

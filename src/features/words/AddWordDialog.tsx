import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { WordForm } from './WordForm';
import { BulkAddForm } from './BulkAddForm';

type Mode = 'single' | 'bulk';

interface AddWordDialogProps {
  onDone: () => void;
}

export function AddWordDialog({ onDone }: AddWordDialogProps) {
  const [mode, setMode] = useState<Mode>('single');

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setMode('single')}>
          Одно слово
        </Button>
        <Button type="button" variant={mode === 'bulk' ? 'default' : 'outline'} size="sm" onClick={() => setMode('bulk')}>
          Список
        </Button>
      </div>

      {mode === 'single' ? <WordForm mode="create" onDone={onDone} /> : <BulkAddForm onDone={onDone} />}
    </div>
  );
}

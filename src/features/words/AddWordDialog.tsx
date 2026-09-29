import { useState } from 'react';
import { SegmentedControl } from '@/components/ui/segmentedControl';
import { useTranslation } from '@/i18n/useTranslation';
import { WordForm } from './WordForm';
import { BulkAddForm } from './BulkAddForm';

type Mode = 'single' | 'bulk';

interface AddWordDialogProps {
  onDone: () => void;
}

export function AddWordDialog({ onDone }: AddWordDialogProps) {
  const [mode, setMode] = useState<Mode>('single');
  const t = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl<Mode>
        value={mode}
        onChange={setMode}
        options={[
          { value: 'single', label: t.singleWordMode },
          { value: 'bulk', label: t.bulkMode },
        ]}
      />

      {mode === 'single' ? <WordForm mode="create" onDone={onDone} /> : <BulkAddForm onDone={onDone} />}
    </div>
  );
}

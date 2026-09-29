import type { DiffPart } from '@/lib/diffPart.type';

interface DiffLettersProps {
  parts: DiffPart[];
  tone: 'missing' | 'extra';
}

const CHANGED_CLASS: Record<DiffLettersProps['tone'], string> = {
  missing: 'rounded-[3px] bg-status-mastered/15 font-bold text-status-mastered',
  extra: 'bg-transparent text-destructive underline decoration-destructive decoration-2 underline-offset-4',
};

export function DiffLetters({ parts, tone }: DiffLettersProps) {
  return (
    <>
      {parts.map((part, index) =>
        part.changed ? (
          <mark key={index} data-diff={tone} className={CHANGED_CLASS[tone]}>
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

import type { DiffPart } from '@/lib/diffPart.type';
import { useTranslation } from '@/i18n/useTranslation';
import { DiffLetters } from './DiffLetters';

interface AnswerDiffProps {
  attempt: DiffPart[];
  expected?: DiffPart[];
}

const LABEL_CLASS = 'text-sm text-muted-foreground';
const LETTERS_CLASS = 'font-mono text-lg leading-snug font-semibold whitespace-pre-wrap [overflow-wrap:anywhere]';

export function AnswerDiff({ attempt, expected }: AnswerDiffProps) {
  const t = useTranslation();

  return (
    <dl data-testid="answer-diff" className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-3 gap-y-1">
      <dt className={LABEL_CLASS}>{t.yourAnswerLabel}</dt>
      <dd lang="en" className={LETTERS_CLASS}>
        <DiffLetters parts={attempt} tone="extra" />
      </dd>
      {expected && (
        <>
          <dt className={LABEL_CLASS}>{t.correctSpellingLabel}</dt>
          <dd lang="en" className={LETTERS_CLASS}>
            <DiffLetters parts={expected} tone="missing" />
          </dd>
        </>
      )}
    </dl>
  );
}

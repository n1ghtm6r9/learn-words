import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_CLASS } from '@/lib/cardClass';
import { matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speak, isSpeechSupported } from '@/lib/tts';
import { useTranslation } from '@/lib/useTranslation';
import type { TranslationKeys } from '@/lib/translationKeys.type';

const CORRECT_FLASH_MS = 500;

export interface RecallCardProps {
  translation: string;
  expectedTerm: string;
  currentStreak?: number;
  requiredStreak?: number;
  onAnswer: (verdict: MatchVerdict) => void;
}

type ErrorVerdict = Exclude<MatchVerdict, 'correct'>;

interface ErrorFeedback {
  verdict: ErrorVerdict;
  correctAnswer: string;
}

const FEEDBACK_COLOR: Record<MatchVerdict, string> = {
  correct: 'text-status-mastered',
  almost: 'text-status-learning',
  wrong: 'text-destructive',
};

function errorFeedbackText(t: TranslationKeys, verdict: ErrorVerdict, correctAnswer: string): string {
  return verdict === 'almost' ? t.recallFeedbackAlmost(correctAnswer) : t.recallFeedbackWrong(correctAnswer);
}

export function RecallCard({ translation, expectedTerm, currentStreak, requiredStreak, onAnswer }: RecallCardProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<ErrorFeedback | null>(null);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);
  const [originalVerdict, setOriginalVerdict] = useState<ErrorVerdict | null>(null);
  const t = useTranslation();

  useEffect(() => {
    if (!showCorrectFlash) return;

    const finish = () => onAnswer(originalVerdict ?? 'correct');
    const timeout = setTimeout(finish, CORRECT_FLASH_MS);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter') return;
      clearTimeout(timeout);
      finish();
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCorrectFlash, originalVerdict, onAnswer]);

  function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    const verdict = matchAnswer(input, expectedTerm);

    if (verdict === 'correct') {
      setError(null);
      setShowCorrectFlash(true);
      return;
    }

    if (originalVerdict === null) setOriginalVerdict(verdict);
    setError({ verdict, correctAnswer: expectedTerm });
  }

  function handleRetry() {
    setError(null);
    setInput('');
  }

  const showProgress = requiredStreak != null && requiredStreak > 0;
  const displayedStreak = originalVerdict === 'wrong' ? 0 : (currentStreak ?? 0);

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-5 p-6`}>
      <div className="border-b border-dashed border-border pb-4">
        <span className="font-mono text-2xl font-semibold tracking-tight">{translation}</span>
      </div>

      <div className="flex min-h-36 flex-col">
        {showCorrectFlash ? (
          <div className="flex items-center gap-2">
            <p data-testid="feedback" className={`text-sm font-medium ${FEEDBACK_COLOR.correct}`}>
              {t.feedbackCorrect}
            </p>
            {isSpeechSupported() && (
              <button
                type="button"
                aria-label={t.speak}
                onClick={() => speak(expectedTerm)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : error ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p data-testid="feedback" className={`text-sm font-medium ${FEEDBACK_COLOR[error.verdict]}`}>
                {errorFeedbackText(t, error.verdict, error.correctAnswer)}
              </p>
              {isSpeechSupported() && (
                <button
                  type="button"
                  aria-label={t.speak}
                  onClick={() => speak(expectedTerm)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t.retryPrompt}</p>
            <Button type="button" onClick={handleRetry} autoFocus>
              {t.retryButton}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleCheck} className="flex flex-col gap-3">
            {showProgress && (
              <p className="font-mono text-xs text-muted-foreground">
                {t.phaseProgress(displayedStreak, requiredStreak ?? 0)}
              </p>
            )}
            <Input aria-label={t.wordInputLabel} value={input} onChange={(e) => setInput(e.target.value)} autoFocus className="font-mono" />
            <Button type="submit">{t.checkAnswer}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_CLASS } from '@/lib/cardClass';
import { matchAccuracy, matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speedFactor } from '@/lib/responseSpeed';
import { PhaseProgressDots } from './PhaseProgressDots';
import { useVisibleElapsedTimer } from '@/lib/useVisibleElapsedTimer';
import { speak, isSpeechSupported } from '@/lib/tts';
import { useTranslation } from '@/lib/useTranslation';
import type { TranslationKeys } from '@/lib/translationKeys.type';

const CORRECT_FLASH_MS = 500;

export interface RecallCardProps {
  translation: string;
  expectedTerm: string;
  currentStreak?: number;
  requiredStreak?: number;
  onAnswer: (verdict: MatchVerdict, accuracy: number, speedFactor: number) => void;
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

function errorFeedbackLabel(t: TranslationKeys, verdict: ErrorVerdict): string {
  return verdict === 'almost' ? t.recallFeedbackAlmost : t.recallFeedbackWrong;
}

export function RecallCard({ translation, expectedTerm, currentStreak, requiredStreak, onAnswer }: RecallCardProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<ErrorFeedback | null>(null);
  const [showCorrectFlash, setShowCorrectFlash] = useState(false);
  const [originalVerdict, setOriginalVerdict] = useState<ErrorVerdict | null>(null);
  const [originalAccuracy, setOriginalAccuracy] = useState<number | null>(null);
  const [correctSpeedFactor, setCorrectSpeedFactor] = useState(1);
  const answeredRef = useRef(false);
  const timer = useVisibleElapsedTimer();
  const t = useTranslation();

  useEffect(() => {
    if (!showCorrectFlash) return;

    function finish() {
      if (answeredRef.current) return;
      answeredRef.current = true;
      onAnswer(originalVerdict ?? 'correct', originalAccuracy ?? 1, correctSpeedFactor);
    }
    const timeout = setTimeout(finish, CORRECT_FLASH_MS);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || event.repeat) return;
      clearTimeout(timeout);
      finish();
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showCorrectFlash, originalVerdict, originalAccuracy, correctSpeedFactor, onAnswer]);

  function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    if (input.trim() === '') return;

    const verdict = matchAnswer(input, expectedTerm);

    if (verdict === 'correct') {
      setError(null);
      setCorrectSpeedFactor(speedFactor(timer.elapsedMs(), expectedTerm.length));
      setShowCorrectFlash(true);
      return;
    }

    if (originalVerdict === null) {
      setOriginalVerdict(verdict);
      setOriginalAccuracy(matchAccuracy(input, expectedTerm));
    }
    setError({ verdict, correctAnswer: expectedTerm });
  }

  function handleRetry() {
    setError(null);
    setInput('');
    timer.restart();
  }

  const showProgress = requiredStreak != null && requiredStreak > 0;
  const displayedStreak = originalVerdict === 'wrong' ? 0 : (currentStreak ?? 0);

  return (
    <div className={`${CARD_CLASS} flex flex-col gap-6 p-6`}>
      <div className="flex flex-col gap-3">
        {showProgress && <PhaseProgressDots current={displayedStreak} total={requiredStreak ?? 0} />}
        <span className="text-2xl leading-snug font-semibold text-balance">{translation}</span>
      </div>

      <div className="flex min-h-32 flex-col justify-center">
        {showCorrectFlash ? (
          <div className="flex items-center gap-2">
            <p data-testid="feedback" className={`text-base font-medium ${FEEDBACK_COLOR.correct}`}>
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
            <div className="flex items-start gap-2">
              <p data-testid="feedback" className={`text-sm ${FEEDBACK_COLOR[error.verdict]}`}>
                {errorFeedbackLabel(t, error.verdict)}{' '}
                <span className="font-mono font-semibold">{error.correctAnswer}</span>
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
            <Input aria-label={t.wordInputLabel} value={input} onChange={(e) => setInput(e.target.value)} autoFocus className="font-mono" />
            <Button type="submit">{t.checkAnswer}</Button>
          </form>
        )}
      </div>
    </div>
  );
}

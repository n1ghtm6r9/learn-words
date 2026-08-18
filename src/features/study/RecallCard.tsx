import { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_CLASS } from '@/lib/cardClass';
import { matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speak, isSpeechSupported } from '@/lib/tts';
import { useTranslation } from '@/lib/useTranslation';
import type { TranslationKeys } from '@/lib/translationKeys.type';

export interface RecallCardProps {
  translation: string;
  expectedTerm: string;
  onAnswer: (verdict: MatchVerdict) => void;
}

interface Feedback {
  verdict: MatchVerdict;
  correctAnswer: string;
}

const FEEDBACK_COLOR: Record<MatchVerdict, string> = {
  correct: 'text-status-mastered',
  almost: 'text-status-learning',
  wrong: 'text-destructive',
};

function feedbackText(t: TranslationKeys, verdict: MatchVerdict, correctAnswer: string): string {
  if (verdict === 'correct') return t.feedbackCorrect;
  if (verdict === 'almost') return t.recallFeedbackAlmost(correctAnswer);
  return t.recallFeedbackWrong(correctAnswer);
}

export function RecallCard({ translation, expectedTerm, onAnswer }: RecallCardProps) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const t = useTranslation();

  function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    const verdict = matchAnswer(input, expectedTerm);
    setFeedback({ verdict, correctAnswer: expectedTerm });
  }

  function handleNext() {
    if (!feedback) return;
    onAnswer(feedback.verdict);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${CARD_CLASS} flex flex-col gap-5 p-6`}
    >
      <div className="border-b border-dashed border-border pb-4">
        <span className="font-mono text-2xl font-semibold tracking-tight">{translation}</span>
      </div>

      {!feedback ? (
        <form onSubmit={handleCheck} className="flex flex-col gap-3">
          <Input aria-label={t.wordInputLabel} value={input} onChange={(e) => setInput(e.target.value)} autoFocus className="font-mono" />
          <Button type="submit">{t.checkAnswer}</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p data-testid="feedback" className={`text-sm font-medium ${FEEDBACK_COLOR[feedback.verdict]}`}>
              {feedbackText(t, feedback.verdict, feedback.correctAnswer)}
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
          <Button type="button" onClick={handleNext}>
            {t.next}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

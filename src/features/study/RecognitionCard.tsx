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

export interface RecognitionCardProps {
  term: string;
  translation: string;
  onAnswer: (verdict: MatchVerdict) => void;
}

interface Feedback {
  verdict: MatchVerdict;
}

const FEEDBACK_COLOR: Record<MatchVerdict, string> = {
  correct: 'text-status-mastered',
  almost: 'text-status-learning',
  wrong: 'text-destructive',
};

function feedbackText(t: TranslationKeys, verdict: MatchVerdict): string {
  if (verdict === 'correct') return t.feedbackCorrect;
  if (verdict === 'almost') return t.recognitionFeedbackAlmost;
  return t.recognitionFeedbackWrong;
}

export function RecognitionCard({ term, translation, onAnswer }: RecognitionCardProps) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const t = useTranslation();

  function handleCheck(event: React.FormEvent) {
    event.preventDefault();
    const verdict = matchAnswer(input, term);
    setFeedback({ verdict });
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
      <div className="flex items-center justify-between gap-3 border-b border-dashed border-border pb-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-2xl font-semibold tracking-tight">{term}</span>
          <span className="text-sm text-muted-foreground">{translation}</span>
        </div>
        {isSpeechSupported() && (
          <button
            type="button"
            aria-label={t.speak}
            onClick={() => speak(term)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
          >
            <Volume2 className="h-[18px] w-[18px]" />
          </button>
        )}
      </div>

      {!feedback ? (
        <form onSubmit={handleCheck} className="flex flex-col gap-3">
          <Input aria-label={t.wordInputLabel} value={input} onChange={(e) => setInput(e.target.value)} autoFocus className="font-mono" />
          <Button type="submit">{t.checkAnswer}</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p data-testid="feedback" className={`text-sm font-medium ${FEEDBACK_COLOR[feedback.verdict]}`}>
            {feedbackText(t, feedback.verdict)}
          </p>
          <Button type="button" onClick={handleNext}>
            {t.next}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

import { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_CLASS } from '@/lib/cardClass';
import { matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speak, isSpeechSupported } from '@/lib/tts';

export interface RecallCardProps {
  translation: string;
  expectedTerm: string;
  onAnswer: (verdict: MatchVerdict) => void;
}

interface Feedback {
  verdict: MatchVerdict;
  correctAnswer: string;
}

const FEEDBACK_TEXT: Record<MatchVerdict, (correct: string) => string> = {
  correct: () => 'Верно!',
  almost: (correct) => `Почти! Правильное слово: ${correct}`,
  wrong: (correct) => `Неверно. Правильное слово: ${correct}`,
};

const FEEDBACK_COLOR: Record<MatchVerdict, string> = {
  correct: 'text-status-mastered',
  almost: 'text-status-learning',
  wrong: 'text-destructive',
};

export function RecallCard({ translation, expectedTerm, onAnswer }: RecallCardProps) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

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
          <Input aria-label="Слово" value={input} onChange={(e) => setInput(e.target.value)} autoFocus className="font-mono" />
          <Button type="submit">Проверить</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <p data-testid="feedback" className={`text-sm font-medium ${FEEDBACK_COLOR[feedback.verdict]}`}>
              {FEEDBACK_TEXT[feedback.verdict](feedback.correctAnswer)}
            </p>
            {isSpeechSupported() && (
              <button
                type="button"
                aria-label="Озвучить"
                onClick={() => speak(expectedTerm)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button type="button" onClick={handleNext}>
            Далее
          </Button>
        </div>
      )}
    </motion.div>
  );
}

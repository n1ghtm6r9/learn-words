import { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { db, type Word } from '@/db/db';
import { DAY_MS, nextSrsState } from '@/lib/srs';
import { matchAnswer, type MatchVerdict } from '@/lib/fuzzyMatch';
import { speak, isSpeechSupported } from '@/lib/tts';
import { useUIStore } from '@/store/useUIStore';

interface FlashcardProps {
  word: Word;
}

interface Feedback {
  verdict: MatchVerdict;
  correctAnswer: string;
}

const FEEDBACK_TEXT: Record<MatchVerdict, (correct: string) => string> = {
  correct: () => 'Верно!',
  almost: (correct) => `Почти! Правильный ответ: ${correct}`,
  wrong: (correct) => `Неверно. Правильный ответ: ${correct}`,
};

export function Flashcard({ word }: FlashcardProps) {
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const recordAnswer = useUIStore((s) => s.recordAnswer);

  async function handleCheck(event: React.FormEvent) {
    event.preventDefault();

    const verdict = matchAnswer(input, word.translation);
    const quality = verdict === 'correct' ? 5 : verdict === 'almost' ? 4 : 2;
    const next = nextSrsState(word, quality);
    const now = Date.now();

    if (word.id != null) {
      await db.words.update(word.id, {
        ...next,
        dueDate: now + next.interval * DAY_MS,
        lastReviewedAt: now,
      });
      await db.reviews.add({ wordId: word.id, reviewedAt: now, correct: verdict !== 'wrong' });
    }

    setFeedback({ verdict, correctAnswer: word.translation });
  }

  function handleNext() {
    if (!feedback) return;
    recordAnswer(feedback.verdict);
    setInput('');
    setFeedback(null);
  }

  return (
    <motion.div
      key={word.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4 rounded-lg border p-6"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold">{word.term}</span>
        {isSpeechSupported() && (
          <button type="button" aria-label="Озвучить" onClick={() => speak(word.term)}>
            🔊
          </button>
        )}
      </div>

      {!feedback ? (
        <form onSubmit={handleCheck} className="flex flex-col gap-3">
          <Input
            aria-label="Перевод"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
          />
          <Button type="submit">Проверить</Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <p
            data-testid="feedback"
            className={
              feedback.verdict === 'correct'
                ? 'text-green-600'
                : feedback.verdict === 'almost'
                  ? 'text-amber-600'
                  : 'text-red-600'
            }
          >
            {FEEDBACK_TEXT[feedback.verdict](feedback.correctAnswer)}
          </p>
          <Button type="button" onClick={handleNext}>
            Далее
          </Button>
        </div>
      )}
    </motion.div>
  );
}

import { Volume2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { Word } from '@/db/word.type';
import { effectiveRating } from '@/lib/effectiveRating';
import { formatDateTime } from '@/lib/formatDateTime';
import { isSpeechSupported, speak } from '@/lib/tts';
import { useTranslation } from '@/lib/useTranslation';
import { useUIStore } from '@/store/useUIStore';

interface WordDetailsDialogProps {
  word: Word | null;
  onOpenChange: (open: boolean) => void;
}

export function WordDetailsDialog({ word, onOpenChange }: WordDetailsDialogProps) {
  const language = useUIStore((s) => s.language);
  const t = useTranslation();

  return (
    <Dialog open={word != null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t.wordDetailsTitle}</DialogTitle>
        {word && (
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t.detailsTerm}</dt>
              <dd className="flex items-start gap-2">
                <span className="font-mono text-base font-medium break-words">{word.term}</span>
                {isSpeechSupported() && (
                  <button
                    type="button"
                    aria-label={t.speak}
                    onClick={() => speak(word.term)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/10"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                )}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t.detailsTranslation}</dt>
              <dd className="break-words">{word.translation}</dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t.detailsKind}</dt>
              <dd>{word.kind === 'phrase' ? t.phraseTag : t.wordTag}</dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t.detailsStatus}</dt>
              <dd>
                {word.stage === 'new'
                  ? t.detailsStatusLearning(word.learningPhase === 'A' ? 1 : 2)
                  : t.detailsStatusReview}
              </dd>
            </div>

            {word.stage === 'review' && (
              <div className="flex flex-col gap-1">
                <dt className="text-xs text-muted-foreground">{t.detailsRating}</dt>
                <dd className="font-mono">{effectiveRating(word, Date.now()).toFixed(2)}</dd>
              </div>
            )}

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t.detailsStreak}</dt>
              <dd className="font-mono">{word.stage === 'new' ? word.phaseStreak : word.reviewStreak}</dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t.detailsLastReviewed}</dt>
              <dd>
                {word.lastReviewedAt == null
                  ? t.detailsNeverReviewed
                  : formatDateTime(word.lastReviewedAt, language)}
              </dd>
            </div>

            <div className="flex flex-col gap-1">
              <dt className="text-xs text-muted-foreground">{t.detailsAdded}</dt>
              <dd>{formatDateTime(word.createdAt, language)}</dd>
            </div>
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}

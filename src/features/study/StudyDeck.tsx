import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CARD_CLASS } from '@/lib/cardClass';
import { cn } from '@/lib/utils';

const MAX_GHOSTS = 2;

interface StudyDeckProps {
  remaining: number;
  cardKey: string;
  children: ReactNode;
}

export function StudyDeck({ remaining, cardKey, children }: StudyDeckProps) {
  const ghosts = Math.max(0, Math.min(MAX_GHOSTS, remaining - 1));

  return (
    <div className="relative overflow-x-clip pb-5" style={{ perspective: 1200 }}>
      {Array.from({ length: ghosts }, (_, i) => i + 1)
        .reverse()
        .map((depth) => (
          <motion.div
            key={depth}
            aria-hidden="true"
            initial={false}
            animate={{ y: depth * 9, scale: 1 - depth * 0.045, opacity: 1 - depth * 0.28 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className={cn(CARD_CLASS, 'pointer-events-none absolute inset-x-0 top-0 bottom-5 origin-bottom')}
            style={{ zIndex: 0 }}
          />
        ))}
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={cardKey}
          exit={{
            x: 360,
            rotate: 9,
            opacity: 0,
            transition: { type: 'spring', stiffness: 260, damping: 30 },
          }}
          className="relative z-10"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

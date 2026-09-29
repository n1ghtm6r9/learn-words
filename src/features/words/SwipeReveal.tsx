import { motion, useTransform, type MotionValue } from 'motion/react';
import { Trash2, Volume2 } from 'lucide-react';
import { SWIPE_CONFIG } from './swipeConfig';

interface SwipeRevealProps {
  x: MotionValue<number>;
}

export function SwipeReveal({ x }: SwipeRevealProps) {
  const speakOpacity = useTransform(x, [0, SWIPE_CONFIG.revealPx], [0, 1]);
  const deleteOpacity = useTransform(x, [-SWIPE_CONFIG.revealPx, 0], [1, 0]);
  const speakScale = useTransform(x, [0, SWIPE_CONFIG.triggerPx], [0.7, 1.15]);
  const deleteScale = useTransform(x, [-SWIPE_CONFIG.triggerPx, 0], [1.15, 0.7]);

  return (
    <>
      <motion.div
        aria-hidden="true"
        style={{ opacity: speakOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-start bg-primary pl-6 text-primary-foreground"
      >
        <motion.span style={{ scale: speakScale }} className="flex">
          <Volume2 className="h-6 w-6" />
        </motion.span>
      </motion.div>
      <motion.div
        aria-hidden="true"
        style={{ opacity: deleteOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-end bg-destructive pr-6 text-white"
      >
        <motion.span style={{ scale: deleteScale }} className="flex">
          <Trash2 className="h-6 w-6" />
        </motion.span>
      </motion.div>
    </>
  );
}

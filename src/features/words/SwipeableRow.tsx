import { useRef, useState, type ReactNode } from 'react';
import { animate, motion, useDragControls, useMotionValue, useMotionValueEvent, type PanInfo } from 'motion/react';
import { cn } from '@/lib/utils';
import { SWIPE_CONFIG } from './swipeConfig';
import { SwipeReveal } from './SwipeReveal';

interface SwipeableRowProps {
  enabled: boolean;
  canSpeak: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  className?: string;
  children: ReactNode;
}

const SPRING = { type: 'spring', stiffness: 520, damping: 38 } as const;

export function SwipeableRow({ enabled, canSpeak, onSwipeLeft, onSwipeRight, className, children }: SwipeableRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const swipedRef = useRef(false);
  const x = useMotionValue(0);
  const controls = useDragControls();
  const [revealed, setRevealed] = useState(false);
  useMotionValueEvent(x, 'change', (value) => setRevealed(value !== 0));

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    window.setTimeout(() => {
      swipedRef.current = false;
    }, SWIPE_CONFIG.clickGuardMs);
    const { offset, velocity } = info;
    const wantsDelete =
      offset.x <= -SWIPE_CONFIG.triggerPx || (velocity.x <= -SWIPE_CONFIG.flingVelocity && offset.x <= -SWIPE_CONFIG.flingMinPx);
    const wantsSpeak =
      canSpeak &&
      (offset.x >= SWIPE_CONFIG.triggerPx || (velocity.x >= SWIPE_CONFIG.flingVelocity && offset.x >= SWIPE_CONFIG.flingMinPx));

    if (wantsDelete) {
      const width = rowRef.current?.offsetWidth ?? 400;
      void animate(x, -width, { duration: 0.16, ease: 'easeIn' }).then(() => {
        onSwipeLeft();
        void animate(x, 0, { ...SPRING, delay: 0.9 });
      });
      return;
    }
    if (wantsSpeak) onSwipeRight();
    void animate(x, 0, SPRING);
  }

  return (
    <>
      {enabled && revealed && <SwipeReveal x={x} />}
      <motion.div
        ref={rowRef}
        drag={enabled ? 'x' : false}
        dragListener={false}
        dragControls={controls}
        dragDirectionLock
        dragMomentum={false}
        dragElastic={SWIPE_CONFIG.elastic}
        dragConstraints={{ left: -SWIPE_CONFIG.maxPx, right: canSpeak ? SWIPE_CONFIG.maxPx : 0 }}
        style={{ x, touchAction: enabled ? 'pan-y' : undefined }}
        onPointerDown={(event) => {
          if (!enabled || (event.target as HTMLElement).closest('[data-no-swipe]')) return;
          controls.start(event);
        }}
        onDragStart={() => {
          swipedRef.current = true;
        }}
        onDragEnd={handleDragEnd}
        onClickCapture={(event) => {
          if (!swipedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
        className={cn('relative bg-inherit', className)}
      >
        {children}
      </motion.div>
    </>
  );
}

import { useRef, type ReactNode } from 'react';
import { animate, motion, useDragControls, useMotionValue, useTransform, type PanInfo } from 'motion/react';
import { Trash2, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SWIPE_CONFIG } from './swipeConfig';

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
  const speakOpacity = useTransform(x, [0, SWIPE_CONFIG.revealPx], [0, 1]);
  const deleteOpacity = useTransform(x, [-SWIPE_CONFIG.revealPx, 0], [1, 0]);
  const speakScale = useTransform(x, [0, SWIPE_CONFIG.triggerPx], [0.7, 1.15]);
  const deleteScale = useTransform(x, [-SWIPE_CONFIG.triggerPx, 0], [1.15, 0.7]);

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
      {enabled && (
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
      )}
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

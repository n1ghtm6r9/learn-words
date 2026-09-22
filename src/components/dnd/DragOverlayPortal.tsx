import { createPortal } from 'react-dom';
import { DragOverlay, defaultDropAnimationSideEffects, type DropAnimation } from '@dnd-kit/core';

const DROP_ANIMATION: DropAnimation = {
  duration: 180,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }),
};

export function DragOverlayPortal({ children }: { children: React.ReactNode }) {
  return createPortal(
    <DragOverlay dropAnimation={DROP_ANIMATION} zIndex={60}>
      {children}
    </DragOverlay>,
    document.body,
  );
}

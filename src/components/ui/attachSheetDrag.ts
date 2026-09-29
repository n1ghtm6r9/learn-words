import { animate } from 'motion/react';
import { clamp } from '@/lib/clamp';
import type { DragSample } from '@/lib/dragSample.type';
import { hasScrolledAncestor } from '@/lib/hasScrolledAncestor';
import { isPhoneViewport } from '@/lib/isPhoneViewport';
import { releaseVelocity } from '@/lib/releaseVelocity';
import { rubberBandOffset } from '@/lib/rubberBandOffset';
import { shouldDismissSheet } from '@/lib/shouldDismissSheet';

const START_SLOP_PX = 6;
const RUBBER_BAND_PX = 16;
const SAMPLE_KEEP_MS = 200;
const CLICK_GUARD_MS = 400;
const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const;
const HANDLE_SELECTOR = '[data-sheet-handle]';
const IGNORED_SELECTOR = '[aria-roledescription], [data-sheet-no-drag], input[type="range"]';

interface SheetDragOptions {
  popup: HTMLElement;
  backdrop: HTMLElement | null;
  dismiss: () => void;
}

interface Gesture {
  startX: number;
  startY: number;
  base: number;
  height: number;
  target: Element;
  fromHandle: boolean;
  dragging: boolean;
  samples: DragSample[];
}

export function attachSheetDrag({ popup, backdrop, dismiss }: SheetDragOptions): () => void {
  let gesture: Gesture | null = null;
  let offset = 0;
  let settle: ReturnType<typeof animate> | null = null;
  let clickGuardUntil = 0;

  const closing = () => popup.hasAttribute('data-closed');

  function apply(next: number) {
    offset = next;
    if (next === 0) {
      popup.style.removeProperty('transform');
      popup.style.removeProperty('transition');
      backdrop?.style.removeProperty('opacity');
      backdrop?.style.removeProperty('transition');
      return;
    }
    popup.style.transition = 'none';
    popup.style.transform = `translate3d(0, ${next}px, 0)`;
    if (!backdrop) return;
    backdrop.style.transition = 'none';
    backdrop.style.opacity = String(1 - clamp(next / (popup.offsetHeight || 1), 0, 1));
  }

  function stopSettling() {
    settle?.stop();
    settle = null;
  }

  function springBack() {
    stopSettling();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      apply(0);
      return;
    }
    settle = animate(offset, 0, {
      ...SPRING,
      onUpdate: apply,
      onComplete: () => {
        settle = null;
        apply(0);
      },
    });
  }

  function close() {
    dismiss();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (popup.isConnected && !closing()) springBack();
      }),
    );
  }

  function canDrag(current: Gesture, dx: number, dy: number): boolean {
    if (Math.abs(dx) > Math.abs(dy)) return false;
    if (current.fromHandle) return true;
    return dy > 0 && !hasScrolledAncestor(current.target, popup);
  }

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) {
      if (gesture?.dragging) springBack();
      gesture = null;
      return;
    }
    const target = event.target;
    if (closing() || !isPhoneViewport() || !(target instanceof Element) || target.closest(IGNORED_SELECTOR)) return;
    stopSettling();
    const touch = event.touches[0];
    gesture = {
      startX: touch.clientX,
      startY: touch.clientY,
      base: offset,
      height: popup.offsetHeight,
      target,
      fromHandle: target.closest(HANDLE_SELECTOR) !== null,
      dragging: false,
      samples: [],
    };
  }

  function onTouchMove(event: TouchEvent) {
    if (!gesture || closing()) return;
    const touch = event.touches[0];
    const dx = touch.clientX - gesture.startX;
    const dy = touch.clientY - gesture.startY;
    if (!gesture.dragging) {
      if (Math.abs(dx) < START_SLOP_PX && Math.abs(dy) < START_SLOP_PX) return;
      if (!canDrag(gesture, dx, dy)) {
        gesture = null;
        if (offset !== 0) springBack();
        return;
      }
      gesture.dragging = true;
    }
    if (event.cancelable) event.preventDefault();
    apply(rubberBandOffset(gesture.base + dy, RUBBER_BAND_PX));
    gesture.samples.push({ y: touch.clientY, time: event.timeStamp });
    while (gesture.samples.length > 2 && event.timeStamp - gesture.samples[0].time > SAMPLE_KEEP_MS) gesture.samples.shift();
  }

  function onTouchEnd(event: TouchEvent) {
    if (event.touches.length > 0) return;
    const finished = gesture;
    gesture = null;
    if (closing()) return;
    if (!finished?.dragging) {
      if (offset !== 0) springBack();
      return;
    }
    clickGuardUntil = event.timeStamp + CLICK_GUARD_MS;
    const velocity = releaseVelocity(finished.samples, event.timeStamp);
    if (event.type === 'touchend' && shouldDismissSheet(offset, finished.height, velocity)) close();
    else springBack();
  }

  function onClick(event: MouseEvent) {
    if (event.timeStamp >= clickGuardUntil) return;
    event.preventDefault();
    event.stopPropagation();
  }

  popup.addEventListener('touchstart', onTouchStart, { passive: true });
  popup.addEventListener('touchmove', onTouchMove, { passive: false });
  popup.addEventListener('touchend', onTouchEnd);
  popup.addEventListener('touchcancel', onTouchEnd);
  popup.addEventListener('click', onClick, true);

  return () => {
    stopSettling();
    popup.removeEventListener('touchstart', onTouchStart);
    popup.removeEventListener('touchmove', onTouchMove);
    popup.removeEventListener('touchend', onTouchEnd);
    popup.removeEventListener('touchcancel', onTouchEnd);
    popup.removeEventListener('click', onClick, true);
  };
}

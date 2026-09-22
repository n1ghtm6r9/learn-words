import { useRef } from 'react';
import type { Dialog as DialogPrimitive } from '@base-ui/react/dialog';

export function useDragAwareOpenChange(onOpenChange: (open: boolean) => void) {
  const dragging = useRef(false);

  function handleOpenChange(open: boolean, details: DialogPrimitive.Root.ChangeEventDetails) {
    if (!open && dragging.current && details.reason === 'escape-key') {
      details.cancel();
      details.allowPropagation();
      return;
    }
    onOpenChange(open);
  }

  function setDragging(value: boolean) {
    dragging.current = value;
  }

  return { handleOpenChange, setDragging };
}

import { useEffect, useEffectEvent, useState } from 'react';
import { attachSheetDrag } from './attachSheetDrag';

export function useSheetDrag(dismiss: () => void) {
  const [popup, setPopup] = useState<HTMLElement | null>(null);
  const [backdrop, setBackdrop] = useState<HTMLElement | null>(null);
  const onDismiss = useEffectEvent(dismiss);

  useEffect(() => {
    if (!popup) return;
    return attachSheetDrag({ popup, backdrop, dismiss: () => onDismiss() });
  }, [popup, backdrop]);

  return { popupRef: setPopup, backdropRef: setBackdrop };
}

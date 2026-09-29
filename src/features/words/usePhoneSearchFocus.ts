import { useEffect, useRef, useState } from 'react';
import { isPhoneViewport } from '@/lib/isPhoneViewport';

const RELEASE_DELAY_MS = 250;

export function usePhoneSearchFocus() {
  const [active, setActive] = useState(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(releaseTimer.current), []);

  return {
    active,
    onFocus: () => {
      clearTimeout(releaseTimer.current);
      setActive(isPhoneViewport());
    },
    onBlur: () => {
      releaseTimer.current = setTimeout(() => setActive(false), RELEASE_DELAY_MS);
    },
  };
}

import { useEffect, useState } from 'react';

const FIRST_BATCH = 24;
const NEXT_BATCH = 32;

export function useProgressiveCount(total: number): number {
  const [count, setCount] = useState(FIRST_BATCH);

  useEffect(() => {
    if (count >= total) return;
    const frame = requestAnimationFrame(() => setCount((current) => current + NEXT_BATCH));
    return () => cancelAnimationFrame(frame);
  }, [count, total]);

  return Math.min(count, total);
}

import { useEffect } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react';

interface CountUpNumberProps {
  value: number;
  delay?: number;
}

const COUNT_UP_SECONDS = 0.9;
const COUNT_UP_EASE = [0.22, 1, 0.36, 1] as const;

export function CountUpNumber({ value, delay = 0 }: CountUpNumberProps) {
  const reduceMotion = useReducedMotion();
  const count = useMotionValue(reduceMotion ? value : 0);
  const shown = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (reduceMotion) {
      count.set(value);
      return;
    }
    const controls = animate(count, value, { duration: COUNT_UP_SECONDS, delay, ease: COUNT_UP_EASE });
    return () => controls.stop();
  }, [count, value, delay, reduceMotion]);

  return <motion.span>{shown}</motion.span>;
}

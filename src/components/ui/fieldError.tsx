import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface FieldErrorProps {
  children: ReactNode;
}

export function FieldError({ children }: FieldErrorProps) {
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="text-sm text-destructive"
    >
      {children}
    </motion.p>
  );
}

import { motion } from 'motion/react';

export function CorrectMark() {
  return (
    <motion.span
      aria-hidden="true"
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 520, damping: 16 }}
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-status-mastered text-white shadow-[0_6px_16px_-4px_var(--status-mastered)]"
    >
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-status-mastered"
        initial={{ scale: 1, opacity: 0.7 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
        />
      </svg>
    </motion.span>
  );
}

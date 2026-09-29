import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FORM_ALERT_TONE_CLASS } from './formAlertToneClass';
import type { FormAlertTone } from './formAlertTone.type';

interface FormAlertProps {
  tone: FormAlertTone;
  children: ReactNode;
}

export function FormAlert({ tone, children }: FormAlertProps) {
  return (
    <motion.p
      role={tone === 'error' ? 'alert' : 'status'}
      initial={{ opacity: 0, y: -6 }}
      animate={tone === 'error' ? { opacity: 1, y: 0, x: [0, -5, 4, -2, 0] } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn('flex items-start gap-2 rounded-xl px-3.5 py-3 text-sm', FORM_ALERT_TONE_CLASS[tone])}
    >
      {tone !== 'info' && <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <span className="min-w-0 break-words">{children}</span>
    </motion.p>
  );
}

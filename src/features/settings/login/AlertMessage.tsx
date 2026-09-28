import type { ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import type { DXCAlert } from 'dexie-cloud-addon';
import { cn } from '@/lib/utils';
import { ALERT_TONE_CLASS } from './alertToneClass';

interface AlertMessageProps {
  tone: DXCAlert['type'];
  children: ReactNode;
}

export function AlertMessage({ tone, children }: AlertMessageProps) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-md p-2.5 text-sm', ALERT_TONE_CLASS[tone])}
    >
      {tone !== 'info' && <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

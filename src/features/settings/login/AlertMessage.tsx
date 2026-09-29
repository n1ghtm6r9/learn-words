import type { ReactNode } from 'react';
import type { DXCAlert } from 'dexie-cloud-addon';
import { FormAlert } from '@/components/ui/formAlert';

interface AlertMessageProps {
  tone: DXCAlert['type'];
  children: ReactNode;
}

export function AlertMessage({ tone, children }: AlertMessageProps) {
  return <FormAlert tone={tone}>{children}</FormAlert>;
}

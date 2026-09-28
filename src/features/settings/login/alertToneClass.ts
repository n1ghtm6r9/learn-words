import type { DXCAlert } from 'dexie-cloud-addon';

export const ALERT_TONE_CLASS: Record<DXCAlert['type'], string> = {
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-status-learning/10 text-status-learning',
  info: 'bg-secondary text-secondary-foreground',
};

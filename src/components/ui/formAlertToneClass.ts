import type { FormAlertTone } from './formAlertTone.type';

export const FORM_ALERT_TONE_CLASS: Record<FormAlertTone, string> = {
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-status-learning/10 text-status-learning',
  info: 'bg-secondary text-secondary-foreground',
};

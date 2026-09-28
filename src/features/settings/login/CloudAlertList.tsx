import type { DXCAlert } from 'dexie-cloud-addon';
import { useTranslation } from '@/i18n/useTranslation';
import { AlertMessage } from './AlertMessage';
import { cloudAlertText } from './cloudAlertText';

interface CloudAlertListProps {
  alerts: DXCAlert[];
}

export function CloudAlertList({ alerts }: CloudAlertListProps) {
  const t = useTranslation();

  return alerts.map((alert, index) => (
    <AlertMessage key={index} tone={alert.type}>
      {cloudAlertText(alert, t)}
    </AlertMessage>
  ));
}

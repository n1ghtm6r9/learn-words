import type { SyncState, UserLogin } from 'dexie-cloud-addon';
import { useTranslation } from '@/i18n/useTranslation';

interface LicenseHintProps {
  license: UserLogin['license'];
  syncLicense: SyncState['license'];
}

export function LicenseHint({ license, syncLicense }: LicenseHintProps) {
  const t = useTranslation();
  const syncOff = [syncLicense, license?.status].some((status) => status === 'expired' || status === 'deactivated');

  if (syncOff) return <p className="text-sm text-status-learning">{t.syncOffHint}</p>;
  if (license?.type === 'eval' && license.evalDaysLeft != null) {
    return <p className="text-sm text-muted-foreground">{t.trialDaysLeft(license.evalDaysLeft)}</p>;
  }
  return null;
}

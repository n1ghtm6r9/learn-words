import { getCloud } from '@/cloud/getCloud';
import type { TelegramWebApp } from './telegramWebApp.type';

export function pullCloudOnActivation(webApp: TelegramWebApp): void {
  const cloud = getCloud();
  if (!cloud) return;

  webApp.onEvent('activated', () => {
    if (!cloud.currentUser.getValue().isLoggedIn) return;
    void cloud.sync({ wait: false, purpose: 'pull' }).catch(() => {});
  });
}

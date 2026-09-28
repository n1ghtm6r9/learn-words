import { safeGetItem } from '@/lib/safeGetItem';
import { useUIStore } from '@/store/useUIStore';
import type { TelegramWebApp } from './telegramWebApp.type';

export function followTelegramColorScheme(webApp: TelegramWebApp): void {
  const adopt = () => {
    if (safeGetItem('theme') !== null) return;
    useUIStore.setState({ theme: webApp.colorScheme });
  };
  adopt();
  webApp.onEvent('themeChanged', adopt);
}

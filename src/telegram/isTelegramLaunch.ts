import { safeGetSessionItem } from '@/lib/safeGetSessionItem';

const LAUNCH_PARAM = 'tgWebAppPlatform';
const STORED_LAUNCH_PARAMS_KEY = '__telegram__initParams';

export function isTelegramLaunch(): boolean {
  return (
    window.location.hash.includes(LAUNCH_PARAM) ||
    (safeGetSessionItem(STORED_LAUNCH_PARAMS_KEY) ?? '').includes(LAUNCH_PARAM)
  );
}

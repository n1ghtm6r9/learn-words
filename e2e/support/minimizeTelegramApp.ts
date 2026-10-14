import type { Page } from '@playwright/test';
import { breakAudioContexts } from './breakAudioContexts';
import { setTelegramVisibility } from './setTelegramVisibility';

export async function minimizeTelegramApp(page: Page): Promise<void> {
  await setTelegramVisibility(page, false);
  await breakAudioContexts(page);
  await setTelegramVisibility(page, true);
}

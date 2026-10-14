import type { Page } from '@playwright/test';
import { breakAudioContexts } from './breakAudioContexts';
import { setPageVisibility } from './setPageVisibility';

export async function backgroundApp(page: Page): Promise<void> {
  await setPageVisibility(page, 'hidden');
  await breakAudioContexts(page);
  await setPageVisibility(page, 'visible');
}

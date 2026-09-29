import type { Page } from '@playwright/test';

export function clearPlayedTones(page: Page): Promise<void> {
  return page.evaluate(() => {
    (window as unknown as { playedTones: number[] }).playedTones.length = 0;
  });
}

import type { Page } from '@playwright/test';

export function playedTones(page: Page): Promise<number[]> {
  return page.evaluate(() => [...(window as unknown as { playedTones: number[] }).playedTones]);
}

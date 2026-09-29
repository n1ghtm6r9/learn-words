import type { Page } from '@playwright/test';

export function spokenTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as unknown as { spoken: string[] }).spoken);
}

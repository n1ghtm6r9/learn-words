import type { Page } from '@playwright/test';

export function setPageVisibility(page: Page, state: 'visible' | 'hidden'): Promise<void> {
  return page.evaluate((value) => {
    Object.defineProperty(document, 'visibilityState', { value, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

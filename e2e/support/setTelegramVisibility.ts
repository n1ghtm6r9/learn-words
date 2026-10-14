import type { Page } from '@playwright/test';

export function setTelegramVisibility(page: Page, isVisible: boolean): Promise<void> {
  return page.evaluate((value) => {
    const telegram = (window as unknown as { Telegram: { WebView: { receiveEvent: (name: string, data: unknown) => void } } }).Telegram;
    telegram.WebView.receiveEvent('visibility_changed', { is_visible: value });
  }, isVisible);
}

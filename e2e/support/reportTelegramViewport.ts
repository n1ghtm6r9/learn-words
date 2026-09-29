import type { Page } from '@playwright/test';

export async function reportTelegramViewport(page: Page, height: number): Promise<void> {
  await page.evaluate((value) => {
    const telegram = (window as unknown as { Telegram: { WebView: { receiveEvent: (name: string, data: unknown) => void } } }).Telegram;
    telegram.WebView.receiveEvent('viewport_changed', { height: value, is_expanded: true, is_state_stable: false });
  }, height);
}

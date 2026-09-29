import type { Page } from '@playwright/test';

export async function openTelegramApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('theme', 'light');
    Object.assign(window, { TelegramWebviewProxy: { postEvent: () => {} } });
  });
  await page.goto('./#tgWebAppPlatform=ios&tgWebAppVersion=8.0&tgWebAppData=');
  await page.getByRole('button', { name: 'Добавить слово' }).waitFor();
  await page.waitForFunction(() => 'Telegram' in window);
}

import type { Page } from '@playwright/test';

export async function goToScreen(page: Page, label: 'Новые' | 'Повторение' | 'Слова'): Promise<void> {
  await page.locator('nav').getByRole('button', { name: label }).click();
  await page.waitForTimeout(400);
}

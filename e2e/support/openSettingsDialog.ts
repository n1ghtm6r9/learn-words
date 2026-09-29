import type { Locator, Page } from '@playwright/test';

export async function openSettingsDialog(page: Page): Promise<Locator> {
  await page.getByRole('button', { name: 'Настройки' }).click();
  const dialog = page.locator('[data-slot=dialog-content]');
  await dialog.getByText('Оформление').waitFor();
  await page.waitForTimeout(400);
  return dialog;
}

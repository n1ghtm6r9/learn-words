import type { Page } from '@playwright/test';

export async function seedWords(page: Page, pairs: [string, string][]): Promise<void> {
  await page.getByRole('button', { name: 'Добавить слово' }).click();
  const dialog = page.locator('[data-slot=dialog-content]');
  await dialog.getByRole('button', { name: 'Список' }).click();
  await dialog.locator('textarea').fill(pairs.map((pair) => pair.join('\t')).join('\n'));
  await dialog.getByRole('button', { name: /^Сохранить всё/ }).click();
  await dialog.waitFor({ state: 'detached' });
}

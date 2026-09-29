import type { Locator, Page } from '@playwright/test';
import { goToScreen } from './goToScreen';
import { seedWords } from './seedWords';

export async function openFolderSheet(page: Page): Promise<Locator> {
  await seedWords(page, [['apple', 'яблоко']]);
  await goToScreen(page, 'Слова');
  await page.getByRole('button', { name: 'Выбрать', exact: true }).click();
  await page.getByRole('checkbox', { name: 'apple' }).click();
  await page.getByRole('button', { name: 'В папку' }).click();
  const sheet = page.locator('[data-slot=bottom-sheet]');
  await sheet.getByText('Переместить в папку').waitFor();
  await page.waitForTimeout(400);
  return sheet;
}

import type { Page } from '@playwright/test';

export async function createFolders(page: Page, names: string[]): Promise<void> {
  await page.getByRole('button', { name: 'Управление папками' }).first().click();
  const input = page.getByPlaceholder('Название папки');
  for (const name of names) {
    await input.fill(name);
    await input.press('Enter');
    await page.getByText(name, { exact: true }).first().waitFor();
  }
  await page.keyboard.press('Escape');
  await page.locator('[data-slot=dialog-content]').waitFor({ state: 'detached' });
}

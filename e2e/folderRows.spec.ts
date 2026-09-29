import { expect, test } from '@playwright/test';
import { createFolders } from './support/createFolders';
import { goToScreen } from './support/goToScreen';
import { mouseDrag } from './support/mouseDrag';
import { openApp } from './support/openApp';
import { seedWords } from './support/seedWords';
import { touchDrag } from './support/touchDrag';

const FOLDERS = Array.from({ length: 12 }, (_, index) => `Папка номер ${String(index + 1).padStart(2, '0')}`);
const LAST_FOLDER = FOLDERS[FOLDERS.length - 1];

test.describe('folder chip rows', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await seedWords(page, [
      ['apple', 'яблоко'],
      ['book', 'книга'],
    ]);
    await goToScreen(page, 'Слова');
    await createFolders(page, FOLDERS);
    await page.reload();
    await goToScreen(page, 'Слова');
  });

  test('many folders collapse and expand with the toggle', async ({ page }) => {
    const lastChip = page.getByRole('button', { name: new RegExp(`^${LAST_FOLDER}`) });
    const showAll = page.getByRole('button', { name: 'Показать все' }).first();

    await expect(showAll).toBeVisible();
    await expect(lastChip).not.toBeInViewport();

    await showAll.click();
    await expect(lastChip).toBeInViewport();

    await page.getByRole('button', { name: 'Свернуть' }).first().click();
    await expect(showAll).toBeVisible();
    await expect(lastChip).not.toBeInViewport();
  });

  test('a word can be dropped on a folder hidden by the collapsed row', async ({ page, hasTouch }) => {
    const handle = page.getByLabel('В папку… apple');
    const target = () => page.getByRole('button', { name: new RegExp(`^${LAST_FOLDER}`) });

    const targetIsReachable = () => expect(target()).toBeInViewport();

    if (hasTouch) await touchDrag(page, handle, target, targetIsReachable);
    else await mouseDrag(page, handle, target, targetIsReachable);

    await expect(target()).toHaveAccessibleName(`${LAST_FOLDER} 1`);
    await expect(page.locator('li', { hasText: 'apple' })).toContainText(LAST_FOLDER);
    await expect(page.locator('li', { hasText: 'book' })).not.toContainText(LAST_FOLDER);
  });
});

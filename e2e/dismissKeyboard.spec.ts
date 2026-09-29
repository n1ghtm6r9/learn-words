import { expect, test } from '@playwright/test';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { seedWords } from './support/seedWords';

test.describe('closing the keyboard on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'the on-screen keyboard exists only on a phone');

  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await seedWords(page, [['apple', 'яблоко']]);
  });

  test('a tap outside the search field closes it', async ({ page }) => {
    await goToScreen(page, 'Слова');
    const search = page.locator('#word-search');
    await search.tap();
    await expect(search).toBeFocused();

    await page.getByText('Всего слов', { exact: false }).tap();

    await expect(search).not.toBeFocused();
  });

  test('the return key in the search closes it', async ({ page }) => {
    await goToScreen(page, 'Слова');
    const search = page.locator('#word-search');
    await search.tap();
    await search.fill('app');

    await search.press('Enter');

    await expect(search).not.toBeFocused();
    await expect(page.getByText('apple', { exact: true })).toBeVisible();
  });

  test('checking an answer keeps the study flow as it was', async ({ page }) => {
    await goToScreen(page, 'Новые');
    const answer = page.getByLabel('Слово', { exact: true });
    await answer.tap();
    await answer.fill('apple');

    await page.getByRole('button', { name: 'Проверить', exact: true }).tap();

    await expect(page.getByRole('button', { name: 'Проверить', exact: true })).toHaveCount(0);
  });
});

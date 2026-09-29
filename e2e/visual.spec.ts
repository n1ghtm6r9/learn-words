import { expect, test } from '@playwright/test';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { seedWords } from './support/seedWords';

const WORDS: [string, string][] = [
  ['apple', 'яблоко'],
  ['book', 'книга'],
  ['light', 'свет'],
  ['run', 'бежать'],
  ['take off', 'взлетать'],
  ['water', 'вода'],
];

test.use({ reducedMotion: 'reduce' });

for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test('empty review', async ({ page }) => {
      await openApp(page, theme);
      await goToScreen(page, 'Повторение');
      await expect(page).toHaveScreenshot(`${theme}-review-empty.png`);
    });

    test('add word dialog', async ({ page }) => {
      await openApp(page, theme);
      await page.getByRole('button', { name: 'Добавить слово' }).click();
      await page.locator('[data-slot=dialog-content]').getByRole('button', { name: 'Список' }).waitFor();
      await expect(page).toHaveScreenshot(`${theme}-add-word.png`);
    });

    test('study card and words list', async ({ page }) => {
      await openApp(page, theme);
      await seedWords(page, WORDS);
      await page.getByRole('button', { name: 'Проверить' }).waitFor();
      await expect(page).toHaveScreenshot(`${theme}-study.png`);

      await goToScreen(page, 'Слова');
      await expect(page).toHaveScreenshot(`${theme}-words.png`);
    });

    test('settings', async ({ page }) => {
      await openApp(page, theme);
      await page.getByRole('button', { name: 'Настройки' }).click();
      const dialog = page.locator('[data-slot=dialog-content]');
      await dialog.getByText('Оформление').waitFor();
      await expect(page).toHaveScreenshot(`${theme}-settings.png`, { mask: [dialog.getByText(/^Версия /)] });
    });
  });
}

import { expect, test } from '@playwright/test';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { seedWords } from './support/seedWords';
import { spokenTexts } from './support/spokenTexts';
import { stubSpeech } from './support/stubSpeech';
import { touchSwipe } from './support/touchSwipe';

test.describe('swipe on word rows', () => {
  test.skip(({ hasTouch }) => !hasTouch, 'swipe is a touch gesture');

  test.beforeEach(async ({ page }) => {
    await stubSpeech(page);
    await openApp(page);
    await seedWords(page, [
      ['apple', 'яблоко'],
      ['book', 'книга'],
      ['run', 'бежать'],
    ]);
    await goToScreen(page, 'Слова');
  });

  test('swiping left deletes the word and undo brings it back', async ({ page }) => {
    const row = page.locator('li', { hasText: 'apple' });
    await touchSwipe(page, row, -220);

    await expect(row).toHaveCount(0);
    const undo = page.getByRole('button', { name: 'Отменить' });
    await expect(undo).toBeVisible();

    await undo.click();
    await expect(page.locator('li', { hasText: 'apple' })).toHaveCount(1);
  });

  test('swiping right speaks the word and keeps it', async ({ page }) => {
    const row = page.locator('li', { hasText: 'book' });
    await touchSwipe(page, row, 220);

    await expect.poll(() => spokenTexts(page)).toContain('book');
    await expect(row).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Отменить' })).toHaveCount(0);
  });

  test('a short swipe snaps back without an action', async ({ page }) => {
    const row = page.locator('li', { hasText: 'run' });
    await touchSwipe(page, row, -30);
    await page.waitForTimeout(400);

    await expect(row).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Отменить' })).toHaveCount(0);
    expect(await spokenTexts(page)).toEqual([]);
  });

  test('swipe is off while selecting words', async ({ page }) => {
    await page.getByRole('button', { name: 'Выбрать', exact: true }).click();
    const row = page.locator('li', { hasText: 'apple' });
    await touchSwipe(page, row, -220);
    await page.waitForTimeout(400);

    await expect(row).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Отменить' })).toHaveCount(0);
  });
});

import { expect, test, type Page } from '@playwright/test';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { openTelegramApp } from './support/openTelegramApp';
import { reportTelegramViewport } from './support/reportTelegramViewport';
import { seedWords } from './support/seedWords';

const FULL = { width: 390, height: 844 };
const WITH_KEYBOARD = { width: 390, height: 500 };

const nav = (page: Page) => page.locator('nav');
const addWord = (page: Page) => page.getByRole('button', { name: 'Добавить слово' });

async function navTop(page: Page): Promise<number> {
  return nav(page).evaluate((element) => element.getBoundingClientRect().top);
}

test.describe('bottom bar and the keyboard inside Telegram', () => {
  test.skip(({ isMobile }) => !isMobile, 'the bottom bar exists only on a phone');

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(FULL);
    await openTelegramApp(page);
  });

  test('the add button steps aside as soon as a field is tapped', async ({ page }) => {
    await goToScreen(page, 'Слова');

    await page.locator('#word-search').tap();

    await expect(addWord(page)).toBeHidden();
    await expect(nav(page)).toBeVisible();
  });

  test('the menu hides once Telegram reports the keyboard over it', async ({ page }) => {
    await goToScreen(page, 'Слова');
    await page.locator('#word-search').tap();

    await reportTelegramViewport(page, WITH_KEYBOARD.height);

    await expect(nav(page)).toBeHidden();
  });

  test('the menu stays where it is while the keyboard covers it', async ({ page }) => {
    await goToScreen(page, 'Слова');
    const before = await navTop(page);

    await page.locator('#word-search').tap();
    await reportTelegramViewport(page, WITH_KEYBOARD.height);
    await page.waitForTimeout(300);

    expect(await navTop(page)).toBeGreaterThanOrEqual(before);
  });

  test('the menu stays out of sight after Telegram shrinks the window and returns once it grows back', async ({ page }) => {
    await goToScreen(page, 'Слова');
    await page.locator('#word-search').tap();
    await reportTelegramViewport(page, WITH_KEYBOARD.height);
    await page.setViewportSize(WITH_KEYBOARD);
    await page.waitForTimeout(300);
    await expect(nav(page)).toBeHidden();

    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await expect(nav(page)).toBeHidden();

    await page.setViewportSize(FULL);
    await reportTelegramViewport(page, FULL.height);
    await expect(nav(page)).toBeVisible();
    await expect(addWord(page)).toBeVisible();
  });

  test('a field focused without a tap leaves the menu alone', async ({ page }) => {
    await goToScreen(page, 'Слова');

    await page.locator('#word-search').focus();
    await page.waitForTimeout(300);

    await expect(nav(page)).toBeVisible();
    await expect(addWord(page)).toBeVisible();
  });

  test('the check button stays above the keyboard on a study card', async ({ page }) => {
    await seedWords(page, [['apple', 'яблоко']]);
    await goToScreen(page, 'Новые');

    await page.getByLabel('Слово', { exact: true }).tap();
    await reportTelegramViewport(page, WITH_KEYBOARD.height);
    await page.waitForTimeout(800);
    const check = (await page.getByRole('button', { name: 'Проверить', exact: true }).boundingBox())!;

    expect(check.y + check.height).toBeLessThanOrEqual(WITH_KEYBOARD.height);
  });
});

test.describe('search on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'the compact search is for a phone');

  test('leaves only the search field on top while typing', async ({ page }) => {
    await openApp(page);
    await seedWords(page, [['apple', 'яблоко']]);
    await goToScreen(page, 'Слова');
    const select = page.getByRole('button', { name: 'Выбрать' });
    await expect(select).toBeVisible();

    await page.locator('#word-search').tap();
    await expect(select).toBeHidden();

    await page.locator('#word-search').blur();
    await expect(select).toBeVisible();
  });
});

test.describe('add-word button while typing', () => {
  test('outside Telegram comes back when no keyboard shows up', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'taps exist only on a phone');
    await openApp(page);
    await goToScreen(page, 'Слова');

    await page.locator('#word-search').tap();
    await expect(addWord(page)).toBeHidden();

    await expect(addWord(page)).toBeVisible({ timeout: 3000 });
  });
});

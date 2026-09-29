import { expect, test } from '@playwright/test';
import { openApp } from './support/openApp';
import { seedWords } from './support/seedWords';

test('a long word wraps inside the card and clears its buttons', async ({ page }) => {
  await openApp(page);
  await seedWords(page, [['internationalization', 'интернационализация']]);

  const term = page.getByText('internationalization', { exact: true });
  const speak = page.getByRole('button', { name: 'Озвучить' });
  const textRight = await term.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return Math.max(...Array.from(range.getClientRects(), (rect) => rect.right));
  });
  const speakBox = (await speak.boundingBox())!;

  expect(textRight).toBeLessThanOrEqual(speakBox.x);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBe(0);
});

test('the browser bar color follows the theme', async ({ page }) => {
  await openApp(page, 'dark');
  const color = () => page.locator('meta[name="theme-color"]').getAttribute('content');
  const dark = await color();

  await page.getByRole('button', { name: 'Настройки' }).click();
  await page.getByRole('button', { name: 'Светлая' }).click();
  const light = await color();

  expect(dark).toMatch(/^#[0-9a-f]{6}$/);
  expect(light).toMatch(/^#[0-9a-f]{6}$/);
  expect(dark).not.toBe(light);
});

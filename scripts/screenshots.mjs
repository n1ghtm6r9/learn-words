import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173/learn-words/';
const outDir = process.env.OUT_DIR ?? 'screenshots';

const devices = [
  { name: 'phone', viewport: { width: 390, height: 844 }, touch: true },
  { name: 'laptop', viewport: { width: 1280, height: 800 }, touch: false },
];
const themes = ['light', 'dark'];
const words = [
  ['apple', 'яблоко'],
  ['run', 'бежать'],
  ['take off', 'взлетать'],
  ['book', 'книга'],
  ['water', 'вода'],
  ['light', 'свет'],
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

for (const device of devices) {
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: device.viewport,
      deviceScaleFactor: 2,
      hasTouch: device.touch,
      isMobile: device.touch,
    });
    const page = await context.newPage();
    await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
    await page.goto(baseUrl);
    await page.waitForTimeout(800);

    const shot = (name) => page.screenshot({ path: `${outDir}/${device.name}-${theme}-${name}.png` });

    await shot('empty');
    await page.getByRole('button', { name: /добав|add/i }).first().click();
    await page.waitForTimeout(500);
    await shot('add-dialog');
    await page.getByRole('button', { name: /список|list/i }).click();
    await page.locator('[data-slot=dialog-content] textarea').first().fill(words.map((pair) => pair.join('\t')).join('\n'));
    await shot('add-bulk');
    await page.locator('[data-slot=dialog-content]').getByRole('button', { name: /сохранить|добавить|save/i }).last().click();
    await page.waitForTimeout(800);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);

    await shot('study');
    await page.locator('input').first().fill('zzz');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await shot('study-wrong');

    await page.locator('nav button').nth(1).click();
    await page.waitForTimeout(700);
    await shot('review');

    await page.locator('nav button').nth(2).click();
    await page.waitForTimeout(900);
    await shot('words');

    await page.getByRole('button', { name: /настройк|settings/i }).first().click();
    await page.waitForTimeout(700);
    await shot('settings');

    await context.close();
  }
}

await browser.close();

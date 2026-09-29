import type { Page } from '@playwright/test';

export async function openApp(page: Page, theme: 'light' | 'dark' = 'light'): Promise<void> {
  await page.addInitScript((value) => {
    localStorage.setItem('theme', value);
    Math.random = () => 0;
    let next = 1;
    const random = crypto.getRandomValues.bind(crypto);
    const deterministic = (array: ArrayBufferView) => {
      if (!(array instanceof Uint8Array)) return random(array as Uint8Array<ArrayBuffer>);
      for (let index = 0; index < array.length; index++) array[index] = (next++ * 37) & 0xff;
      return array;
    };
    crypto.getRandomValues = deterministic as typeof crypto.getRandomValues;
  }, theme);
  await page.goto('./');
  await page.getByRole('button', { name: 'Добавить слово' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
}

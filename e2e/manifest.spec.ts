import { expect, test } from '@playwright/test';
import { openApp } from './support/openApp';

test('the page links a web app manifest that loads with its icons', async ({ page }) => {
  await openApp(page);
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const manifestUrl = new URL(href!, page.url());
  const response = await page.request.get(manifestUrl.href);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest.name).toBe('Мой словарь');
  expect(manifest.display).toBe('standalone');
  expect(new URL(manifest.start_url, manifestUrl).pathname).toBe('/learn-words/');

  const icons: { src: string; sizes: string; purpose?: string }[] = manifest.icons;
  expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(icons.some((icon) => icon.purpose === 'maskable')).toBe(true);
  for (const icon of icons) {
    const image = await page.request.get(new URL(icon.src, manifestUrl).href);
    expect(image.ok(), icon.src).toBe(true);
    expect(image.headers()['content-type']).toContain('image/png');
  }

  const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
  expect((await page.request.get(new URL(touchIcon!, page.url()).href)).ok()).toBe(true);
});

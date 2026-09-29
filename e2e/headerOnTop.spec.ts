import { expect, test } from '@playwright/test';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { seedWords } from './support/seedWords';

test('the header stays above the word list scrolled to its end', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the header is sticky only on a phone');
  await openApp(page);
  await seedWords(
    page,
    Array.from({ length: 12 }, (_, index) => [`word${String(index).padStart(2, '0')}`, `слово ${index}`] as [string, string]),
  );
  await goToScreen(page, 'Слова');

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);

  const coveredByHeader = await page.evaluate(() => {
    const header = document.querySelector('header')!;
    const box = header.getBoundingClientRect();
    return [0.2, 0.5, 0.8].every((share) => {
      const hit = document.elementFromPoint(box.left + box.width * share, box.top + box.height / 2);
      return hit !== null && header.contains(hit);
    });
  });
  expect(coveredByHeader).toBe(true);
});

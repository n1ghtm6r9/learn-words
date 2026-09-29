import { expect, test, type Page } from '@playwright/test';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { openTelegramApp } from './support/openTelegramApp';
import { seedWords } from './support/seedWords';
import { reportTelegramViewport } from './support/reportTelegramViewport';

const FULL = { width: 390, height: 844 };
const WITH_KEYBOARD = { width: 390, height: 500 };

async function recordNavTopsOnResize(page: Page): Promise<void> {
  await page.evaluate(() => {
    const nav = document.querySelector('nav')!;
    const tops: number[] = [];
    Object.assign(window, { navTops: tops });
    window.addEventListener(
      'resize',
      () => {
        tops.push(nav.getBoundingClientRect().top);
        const startedAt = performance.now();
        const sample = () => {
          tops.push(nav.getBoundingClientRect().top);
          if (performance.now() - startedAt < 600) requestAnimationFrame(sample);
        };
        requestAnimationFrame(sample);
      },
      { once: true },
    );
  });
}

async function resizeAndCollectNavTops(page: Page, size: { width: number; height: number }): Promise<number[]> {
  await recordNavTopsOnResize(page);
  await page.setViewportSize(size);
  await page.waitForTimeout(800);
  return page.evaluate(() => (window as unknown as { navTops: number[] }).navTops);
}

async function reportAndCollectNavTops(page: Page, height: number): Promise<number[]> {
  const tops = page.evaluate(
    () =>
      new Promise<number[]>((resolve) => {
        const nav = document.querySelector('nav')!;
        const collected: number[] = [];
        window.addEventListener(
          'keyboardinsetchange',
          () => {
            collected.push(nav.getBoundingClientRect().top);
            const startedAt = performance.now();
            const sample = () => {
              collected.push(nav.getBoundingClientRect().top);
              if (performance.now() - startedAt < 600) requestAnimationFrame(sample);
              else resolve(collected);
            };
            requestAnimationFrame(sample);
          },
          { once: true },
        );
      }),
  );
  await reportTelegramViewport(page, height);
  return tops;
}

async function navTop(page: Page): Promise<number> {
  return page.locator('nav').evaluate((nav) => nav.getBoundingClientRect().top);
}

test.describe('bottom nav and the on-screen keyboard', () => {
  test.skip(({ isMobile }) => !isMobile, 'the bottom nav exists only on a phone');

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(FULL);
    await openApp(page);
  });

  test('glides up with the keyboard instead of jumping', async ({ page }) => {
    const before = await navTop(page);
    const tops = await resizeAndCollectNavTops(page, WITH_KEYBOARD);
    const after = await navTop(page);

    expect(after).toBeLessThan(before - 300);
    expect(tops[0]).toBeCloseTo(before, 0);
    expect(tops.some((top) => top < before - 40 && top > after + 40)).toBe(true);
    expect(tops.at(-1)).toBeCloseTo(after, 0);
  });

  test('glides down when the keyboard closes', async ({ page }) => {
    await page.setViewportSize(WITH_KEYBOARD);
    await page.waitForTimeout(500);
    const before = await navTop(page);
    const tops = await resizeAndCollectNavTops(page, FULL);
    const after = await navTop(page);

    expect(after).toBeGreaterThan(before + 300);
    expect(tops[0]).toBeCloseTo(before, 0);
    expect(tops.some((top) => top > before + 40 && top < after - 40)).toBe(true);
    expect(tops.at(-1)).toBeCloseTo(after, 0);
  });

  test('the add-word button rides along with the nav', async ({ page }) => {
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const nav = document.querySelector('nav')!;
      const button = document.querySelector('[aria-label="Добавить слово"]')!;
      const gaps: number[] = [];
      Object.assign(window, { gaps });
      window.addEventListener(
        'resize',
        () => {
          const startedAt = performance.now();
          const sample = () => {
            gaps.push(nav.getBoundingClientRect().top - button.getBoundingClientRect().top);
            if (performance.now() - startedAt < 600) requestAnimationFrame(sample);
          };
          sample();
        },
        { once: true },
      );
    });
    await page.setViewportSize(WITH_KEYBOARD);
    await page.waitForTimeout(800);
    const gaps = await page.evaluate(() => (window as unknown as { gaps: number[] }).gaps);

    expect(gaps.length).toBeGreaterThan(5);
    for (const gap of gaps) expect(gap).toBeCloseTo(gaps[0], 0);
  });

  test('snaps to place when the screen rotates', async ({ page }) => {
    const tops = await resizeAndCollectNavTops(page, { width: 430, height: 600 });
    const after = await navTop(page);

    expect(tops[0]).toBeCloseTo(after, 0);
  });

  test('snaps to place when the learner asks for less motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const tops = await resizeAndCollectNavTops(page, WITH_KEYBOARD);
    const after = await navTop(page);

    expect(tops[0]).toBeCloseTo(after, 0);
  });
});

test.describe('bottom nav and the keyboard inside Telegram on iPhone', () => {
  test.skip(({ isMobile }) => !isMobile, 'the bottom nav exists only on a phone');

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(FULL);
    await openTelegramApp(page);
    await goToScreen(page, 'Слова');
    await page.locator('#word-search').tap();
  });

  test('rises as soon as Telegram reports the keyboard, before the window shrinks', async ({ page }) => {
    const before = await navTop(page);
    const tops = await reportAndCollectNavTops(page, WITH_KEYBOARD.height);
    const navBox = (await page.locator('nav').boundingBox())!;

    expect(tops[0]).toBeCloseTo(before, 0);
    expect(tops.some((top) => top < before - 40 && top > navBox.y + 40)).toBe(true);
    expect(navBox.y + navBox.height).toBeCloseTo(WITH_KEYBOARD.height, 0);
  });

  test('stays put when Telegram shrinks the window later', async ({ page }) => {
    await reportTelegramViewport(page, WITH_KEYBOARD.height);
    await page.waitForTimeout(500);
    const before = await navTop(page);
    const tops = await resizeAndCollectNavTops(page, WITH_KEYBOARD);

    for (const top of tops) expect(top).toBeCloseTo(before, 0);
  });

  test('goes back down when the keyboard closes', async ({ page }) => {
    await reportTelegramViewport(page, WITH_KEYBOARD.height);
    await page.setViewportSize(WITH_KEYBOARD);
    await page.waitForTimeout(500);

    await page.evaluate(() => (document.activeElement as HTMLElement).blur());
    await page.setViewportSize(FULL);
    await reportTelegramViewport(page, FULL.height);
    await page.waitForTimeout(500);
    const navBox = (await page.locator('nav').boundingBox())!;

    expect(navBox.y + navBox.height).toBeCloseTo(FULL.height, 0);
  });
});

test.describe('add-word button and the keyboard', () => {
  test.skip(({ isMobile }) => !isMobile, 'the on-screen keyboard exists only on a phone');

  const addWord = (page: Page) => page.getByRole('button', { name: 'Добавить слово' });

  test('stays on a study card whose answer field is focused without a keyboard', async ({ page }) => {
    await openApp(page);
    await seedWords(page, [['apple', 'яблоко']]);

    await goToScreen(page, 'Новые');
    await page.getByLabel('Слово', { exact: true }).focus();
    await page.waitForTimeout(800);

    await expect(addWord(page)).toBeVisible();
  });

  test('steps aside while the keyboard is open inside Telegram', async ({ page }) => {
    await page.setViewportSize(FULL);
    await openTelegramApp(page);
    await goToScreen(page, 'Слова');
    await page.locator('#word-search').tap();
    await expect(addWord(page)).toBeVisible();

    await reportTelegramViewport(page, WITH_KEYBOARD.height);
    await expect(addWord(page)).toBeHidden();

    await page.setViewportSize(WITH_KEYBOARD);
    await page.waitForTimeout(300);
    await expect(addWord(page)).toBeHidden();

    await page.locator('#word-search').blur();
    await page.setViewportSize(FULL);
    await reportTelegramViewport(page, FULL.height);
    await expect(addWord(page)).toBeVisible();
  });
});

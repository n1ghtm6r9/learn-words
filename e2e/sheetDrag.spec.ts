import { expect, test, type Locator, type Page } from '@playwright/test';
import { openApp } from './support/openApp';
import { openFolderSheet } from './support/openFolderSheet';
import { openSettingsDialog } from './support/openSettingsDialog';
import { touchPull } from './support/touchPull';

async function topOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('element is not visible');
  return box.y;
}

async function opacityOf(page: Page, selector: string): Promise<number> {
  return page.locator(selector).evaluate((element) => Number(getComputedStyle(element).opacity));
}

test.describe('pulling a sheet down on a phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'sheets are pulled down only on a phone');

  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test('a long pull on the settings handle follows the finger and closes the dialog', async ({ page }) => {
    const dialog = await openSettingsDialog(page);
    const restingTop = await topOf(dialog);
    let pulledBy = 0;
    let backdropOpacity = 1;

    await touchPull(page, dialog.locator('[data-sheet-handle]'), 400, {
      steps: 16,
      beforeRelease: async () => {
        pulledBy = (await topOf(dialog)) - restingTop;
        backdropOpacity = await opacityOf(page, '[data-slot=dialog-overlay]');
      },
    });

    expect(pulledBy).toBeGreaterThan(380);
    expect(backdropOpacity).toBeLessThan(0.7);
    await expect(dialog).toHaveCount(0);
  });

  test('a short pull on the settings handle springs back and keeps the dialog open', async ({ page }) => {
    const dialog = await openSettingsDialog(page);
    const restingTop = await topOf(dialog);
    let pulledBy = 0;

    await touchPull(page, dialog.locator('[data-sheet-handle]'), 60, {
      steps: 12,
      stepMs: 24,
      beforeRelease: async () => {
        pulledBy = (await topOf(dialog)) - restingTop;
      },
    });
    await page.waitForTimeout(600);

    expect(pulledBy).toBeGreaterThan(50);
    await expect(dialog).toBeVisible();
    expect(await topOf(dialog)).toBeCloseTo(restingTop, 0);
    expect(await opacityOf(page, '[data-slot=dialog-overlay]')).toBe(1);
  });

  test('a quick flick closes the settings even when it is short', async ({ page }) => {
    const dialog = await openSettingsDialog(page);

    await touchPull(page, dialog.getByText('Оформление'), 90, { steps: 3, stepMs: 0 });

    await expect(dialog).toHaveCount(0);
  });

  test('pulling scrolled settings content scrolls it instead of moving the dialog', async ({ page }) => {
    const dialog = await openSettingsDialog(page);
    const scroller = dialog.locator('.overflow-y-auto').first();
    await scroller.evaluate((element) => {
      element.scrollTop = 200;
    });
    const restingTop = await topOf(dialog);
    let pulledBy = 0;

    await touchPull(page, dialog.getByText('Языки', { exact: true }), 300, {
      beforeRelease: async () => {
        pulledBy = (await topOf(dialog)) - restingTop;
      },
    });
    await page.waitForTimeout(600);

    expect(pulledBy).toBe(0);
    await expect(dialog).toBeVisible();
    expect(await scroller.evaluate((element) => element.scrollTop)).toBeLessThan(200);
  });

  test('a long pull on a bottom sheet closes it', async ({ page }) => {
    const sheet = await openFolderSheet(page);

    await touchPull(page, sheet.getByText('Переместить в папку'), 400, { steps: 16 });

    await expect(sheet).toHaveCount(0);
  });

  test('a short pull on a bottom sheet springs back and keeps it open', async ({ page }) => {
    const sheet = await openFolderSheet(page);
    const restingTop = await topOf(sheet);
    let pulledBy = 0;

    await touchPull(page, sheet.getByText('Переместить в папку'), 40, {
      steps: 10,
      stepMs: 24,
      beforeRelease: async () => {
        pulledBy = (await topOf(sheet)) - restingTop;
      },
    });
    await page.waitForTimeout(600);

    expect(pulledBy).toBeGreaterThan(30);
    await expect(sheet).toBeVisible();
    expect(await topOf(sheet)).toBeCloseTo(restingTop, 0);
  });
});

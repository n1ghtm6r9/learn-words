import { expect, test } from '@playwright/test';
import { closeAndTraceBackdrop } from './support/closeAndTraceBackdrop';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { risesAfterFading } from './support/risesAfterFading';
import { seedWords } from './support/seedWords';

test.describe('closing a popup does not flash the backdrop', () => {
  test('settings dialog', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Настройки' }).click();
    await page.locator('[data-slot=dialog-content]').getByText('Оформление').waitFor();
    await page.waitForTimeout(400);

    const trace = await closeAndTraceBackdrop(page, '[data-slot=dialog-overlay]');

    expect(trace.length).toBeGreaterThan(3);
    expect(risesAfterFading(trace), `backdrop opacity per frame: ${trace.map((v) => v.toFixed(2)).join(' ')}`).toBe(false);
  });

  test('add word dialog', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Добавить слово' }).click();
    await page.locator('[data-slot=dialog-content]').getByRole('button', { name: 'Список' }).waitFor();
    await page.waitForTimeout(400);

    const trace = await closeAndTraceBackdrop(page, '[data-slot=dialog-overlay]');

    expect(trace.length).toBeGreaterThan(3);
    expect(risesAfterFading(trace), `backdrop opacity per frame: ${trace.map((v) => v.toFixed(2)).join(' ')}`).toBe(false);
  });

  test('bottom sheet', async ({ page }) => {
    await openApp(page);
    await seedWords(page, [['apple', 'яблоко']]);
    await goToScreen(page, 'Слова');
    await page.getByRole('button', { name: 'Выбрать', exact: true }).click();
    await page.getByRole('checkbox', { name: 'apple' }).click();
    await page.getByRole('button', { name: 'В папку' }).click();
    await page.getByText('Переместить в папку').waitFor();
    await page.waitForTimeout(400);

    const trace = await closeAndTraceBackdrop(page, '[data-slot=bottom-sheet-backdrop]');

    expect(trace.length).toBeGreaterThan(3);
    expect(risesAfterFading(trace), `backdrop opacity per frame: ${trace.map((v) => v.toFixed(2)).join(' ')}`).toBe(false);
  });
});

import type { Locator, Page } from '@playwright/test';

const HOLD_MS = 320;
const STEPS = 16;

async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('drag point is not visible');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export async function touchDrag(
  page: Page,
  handle: Locator,
  resolveTarget: () => Locator,
  whileDragging: () => Promise<void> = async () => {},
): Promise<void> {
  const start = await centerOf(handle);
  const cdp = await page.context().newCDPSession(page);
  const touch = (point: { x: number; y: number }) => [{ ...point, id: 1 }];

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touch(start) });
  await page.waitForTimeout(HOLD_MS);
  const nudge = { x: start.x + 2, y: start.y - 12 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(nudge) });
  await page.waitForTimeout(150);

  await whileDragging();
  const end = await centerOf(resolveTarget());
  for (let step = 1; step <= STEPS; step++) {
    const point = {
      x: nudge.x + ((end.x - nudge.x) * step) / STEPS,
      y: nudge.y + ((end.y - nudge.y) * step) / STEPS,
    };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touch(point) });
    await page.waitForTimeout(20);
  }
  await page.waitForTimeout(120);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

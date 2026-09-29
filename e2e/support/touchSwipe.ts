import type { Locator, Page } from '@playwright/test';

const STEPS = 12;

export async function touchSwipe(page: Page, target: Locator, deltaX: number): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('swipe target is not visible');
  const startX = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  const point = (x: number) => [{ x, y, id: 1 }];

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(startX) });
  for (let step = 1; step <= STEPS; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(startX + (deltaX * step) / STEPS) });
    await page.waitForTimeout(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

import type { Locator, Page } from '@playwright/test';

interface TouchPullOptions {
  steps?: number;
  stepMs?: number;
  beforeRelease?: () => Promise<void>;
}

export async function touchPull(
  page: Page,
  target: Locator,
  deltaY: number,
  { steps = 12, stepMs = 16, beforeRelease }: TouchPullOptions = {},
): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('pull target is not visible');
  const x = box.x + box.width / 2;
  const startY = box.y + box.height / 2;
  const cdp = await page.context().newCDPSession(page);
  const point = (y: number) => [{ x, y, id: 1 }];

  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(startY) });
  for (let step = 1; step <= steps; step++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(startY + (deltaY * step) / steps) });
    if (stepMs > 0) await page.waitForTimeout(stepMs);
  }
  await beforeRelease?.();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

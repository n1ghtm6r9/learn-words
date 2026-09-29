import type { Locator, Page } from '@playwright/test';

async function centerOf(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('drag point is not visible');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

export async function mouseDrag(
  page: Page,
  handle: Locator,
  resolveTarget: () => Locator,
  whileDragging: () => Promise<void> = async () => {},
): Promise<void> {
  const start = await centerOf(handle);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 4, start.y - 12, { steps: 4 });
  await page.waitForTimeout(150);
  await whileDragging();
  const end = await centerOf(resolveTarget());
  await page.mouse.move(end.x, end.y, { steps: 16 });
  await page.waitForTimeout(120);
  await page.mouse.up();
}

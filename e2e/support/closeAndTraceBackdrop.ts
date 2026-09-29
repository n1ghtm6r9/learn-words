import type { Page } from '@playwright/test';

const TRACE_MS = 600;

export async function closeAndTraceBackdrop(page: Page, backdropSelector: string): Promise<number[]> {
  await page.evaluate(
    ({ selector, traceMs }) => {
      const trace: number[] = [];
      Object.assign(window, { backdropTrace: trace });
      const start = performance.now();
      const sample = () => {
        const backdrop = document.querySelector(selector);
        if (!backdrop) return;
        trace.push(Number(getComputedStyle(backdrop).opacity));
        if (performance.now() - start < traceMs) requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    },
    { selector: backdropSelector, traceMs: TRACE_MS },
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(TRACE_MS);
  return page.evaluate(() => (window as unknown as { backdropTrace: number[] }).backdropTrace);
}

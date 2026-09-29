import type { Page } from '@playwright/test';

export function audioStates(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    (window as unknown as { audioContexts: AudioContext[] }).audioContexts.map((context) => context.state),
  );
}

import type { Page } from '@playwright/test';

export function breakAudioContexts(page: Page): Promise<void> {
  return page.evaluate(async () => {
    const contexts = (window as unknown as { audioContexts: AudioContext[] }).audioContexts;
    for (const context of contexts) {
      if (context.state === 'closed') continue;
      context.resume = () => new Promise<void>(() => undefined);
      await context.suspend().catch(() => undefined);
    }
  });
}

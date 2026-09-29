import type { Page } from '@playwright/test';

export async function stubSpeech(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.assign(window, { spoken });
    window.speechSynthesis.speak = (utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance.text);
    };
  });
}

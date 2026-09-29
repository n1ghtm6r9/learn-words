import { expect, test, type Page } from '@playwright/test';
import { audioStates } from './support/audioStates';
import { clearPlayedTones } from './support/clearPlayedTones';
import { goToScreen } from './support/goToScreen';
import { openApp } from './support/openApp';
import { openSettingsDialog } from './support/openSettingsDialog';
import { playedTones } from './support/playedTones';
import { recordSounds } from './support/recordSounds';
import { seedWords } from './support/seedWords';
import { stubSpeech } from './support/stubSpeech';

const CORRECT = [987.77, 1318.51, 659.25];
const WRONG = [293.66, 220];

async function press(page: Page, name: string): Promise<void> {
  const button = page.getByRole('button', { name, exact: true });
  const hasTouch = await page.evaluate(() => navigator.maxTouchPoints > 0);
  if (hasTouch) await button.tap();
  else await button.click();
}

async function answer(page: Page, text: string): Promise<void> {
  await page.getByLabel('Слово', { exact: true }).fill(text);
  await clearPlayedTones(page);
  await press(page, 'Проверить');
}

test.describe('sounds', () => {
  test.beforeEach(async ({ page }) => {
    await stubSpeech(page);
    await recordSounds(page);
    await openApp(page);
  });

  test('only a mistake and a correct answer make a sound', async ({ page }) => {
    await seedWords(page, [['apple', 'яблоко']]);
    await goToScreen(page, 'Новые');
    expect(await playedTones(page)).toEqual([]);

    await answer(page, 'pear');
    await expect.poll(() => playedTones(page)).toEqual(WRONG);
    expect(await audioStates(page)).toEqual(['running']);

    await clearPlayedTones(page);
    await press(page, 'Повторить');
    await page.waitForTimeout(200);
    expect(await playedTones(page)).toEqual([]);

    await answer(page, 'apple');
    await expect.poll(() => playedTones(page)).toEqual(CORRECT);
  });

  test('the settings switch silences answers', async ({ page }) => {
    const dialog = await openSettingsDialog(page);
    expect(await playedTones(page)).toEqual([]);

    await dialog.getByRole('group', { name: 'Звуки' }).getByRole('button', { name: 'Выкл' }).click();

    await page.reload();
    await page.getByRole('button', { name: 'Добавить слово' }).waitFor();
    await seedWords(page, [['apple', 'яблоко']]);
    await goToScreen(page, 'Новые');
    await answer(page, 'pear');
    await page.waitForTimeout(200);
    expect(await playedTones(page)).toEqual([]);

    const reopened = await openSettingsDialog(page);
    await reopened.getByRole('group', { name: 'Звуки' }).getByRole('button', { name: 'Вкл' }).click();
    await expect.poll(() => playedTones(page)).toEqual(CORRECT);
  });
});

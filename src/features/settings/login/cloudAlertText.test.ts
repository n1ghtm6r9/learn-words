import { describe, expect, it } from 'vitest';
import type { DXCAlert } from 'dexie-cloud-addon';
import { TRANSLATIONS } from '@/i18n/translations';
import { cloudAlertText } from './cloudAlertText';

const t = TRANSLATIONS.ru;

function genericError(message: string): DXCAlert {
  return { type: 'error', messageCode: 'GENERIC_ERROR', message, messageParams: {} };
}

describe('cloudAlertText', () => {
  it('explains a lost connection in the interface language', () => {
    const alert = genericError(
      "Could not connect to server. Please verify that your origin 'http://localhost:5199' is whitelisted using `npx dexie-cloud whitelist`",
    );
    expect(cloudAlertText(alert, t)).toBe(t.alertNoConnection);
  });

  it('treats a failed fetch as a lost connection too', () => {
    expect(cloudAlertText(genericError('TypeError: Failed to fetch'), t)).toBe(t.alertNoConnection);
  });

  it('keeps other generic errors as the server sent them', () => {
    expect(cloudAlertText(genericError('Server is down for maintenance'), t)).toBe('Server is down for maintenance');
  });
});

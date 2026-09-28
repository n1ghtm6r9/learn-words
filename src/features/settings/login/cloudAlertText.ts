import { resolveText, type DXCAlert } from 'dexie-cloud-addon';
import type { TranslationKeys } from '@/i18n/translationKeys.type';

export function cloudAlertText(alert: DXCAlert, t: TranslationKeys): string {
  switch (alert.messageCode) {
    case 'INVALID_OTP':
      return t.alertInvalidOtp;
    case 'INVALID_EMAIL':
      return t.alertInvalidEmail;
    case 'LICENSE_LIMIT_REACHED':
      return t.alertLicenseLimit;
    case 'NO_SEATS_AVAILABLE':
      return t.alertNoSeats;
    case 'USER_DEACTIVATED':
      return t.alertUserDeactivated;
    case 'USER_NOT_REGISTERED':
      return t.alertUserNotRegistered;
    case 'USER_NOT_ACCEPTED':
      return t.alertUserNotAccepted;
    case 'OTP_SENT':
      return t.alertOtpSent;
    case 'LOGOUT_CONFIRMATION':
      return t.alertUnsyncedChanges(Number(alert.messageParams.numUnsyncedChanges));
    default:
      return resolveText(alert);
  }
}

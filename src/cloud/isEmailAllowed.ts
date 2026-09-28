import { ALLOWED_EMAIL_HASHES } from './allowedEmailHashes';
import { hashEmail } from './hashEmail';

export async function isEmailAllowed(email: string): Promise<boolean> {
  if (ALLOWED_EMAIL_HASHES.length === 0) return true;
  return ALLOWED_EMAIL_HASHES.includes(await hashEmail(email));
}

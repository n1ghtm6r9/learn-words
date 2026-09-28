import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isEmailAllowed } from './isEmailAllowed';

const allowed = vi.hoisted(() => [] as string[]);

vi.mock('./allowedEmailHashes', () => ({ ALLOWED_EMAIL_HASHES: allowed }));

const ANNA_HASH = 'f7d54c22dda5b1780276601cd005909b70543fc4a6ba72d735b4cb9bbb611f01';

describe('isEmailAllowed', () => {
  beforeEach(() => {
    allowed.splice(0, allowed.length);
  });

  it('lets anyone in when no allowed emails are configured', async () => {
    expect(await isEmailAllowed('stranger@example.com')).toBe(true);
  });

  it('lets in an email from the allowed list regardless of case and spaces', async () => {
    allowed.push(ANNA_HASH);

    expect(await isEmailAllowed(' ANNA@example.com')).toBe(true);
  });

  it('keeps out an email missing from the allowed list', async () => {
    allowed.push(ANNA_HASH);

    expect(await isEmailAllowed('stranger@example.com')).toBe(false);
  });
});

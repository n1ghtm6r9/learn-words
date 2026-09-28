import { describe, expect, it } from 'vitest';
import { hashEmail } from './hashEmail';

const ANNA_HASH = 'f7d54c22dda5b1780276601cd005909b70543fc4a6ba72d735b4cb9bbb611f01';

describe('hashEmail', () => {
  it('returns the lowercase hex SHA-256 of the email', async () => {
    expect(await hashEmail('anna@example.com')).toBe(ANNA_HASH);
  });

  it('ignores surrounding spaces and letter case', async () => {
    expect(await hashEmail('  Anna@Example.COM ')).toBe(ANNA_HASH);
  });

  it('gives different emails different hashes', async () => {
    expect(await hashEmail('boris@example.com')).not.toBe(ANNA_HASH);
  });
});

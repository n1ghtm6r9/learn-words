import { describe, expect, it } from 'vitest';
import { dbNameFor } from './dbNameFor';

describe('dbNameFor', () => {
  it('keeps the original database name for English so existing dictionaries stay in place', () => {
    expect(dbNameFor('en')).toBe('vocab-db');
  });

  it('gives every other studied language a database of its own', () => {
    expect(dbNameFor('es')).toBe('vocab-db-es');
  });
});

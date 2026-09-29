import { describe, expect, it } from 'vitest';
import { safeFileName } from './safeFileName';

describe('safeFileName', () => {
  it('keeps a normal export name', () => {
    expect(safeFileName('learn-words-en-export-2026-09-29.json')).toBe('learn-words-en-export-2026-09-29.json');
  });

  it('replaces path separators and control characters', () => {
    expect(safeFileName('../a\nb.json')).toBe('.._a_b.json');
  });

  it('falls back to a default name and adds the extension', () => {
    expect(safeFileName('   ')).toBe('learn-words-export.json');
    expect(safeFileName('backup')).toBe('backup.json');
  });
});

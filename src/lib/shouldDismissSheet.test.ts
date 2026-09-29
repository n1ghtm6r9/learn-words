import { describe, expect, it } from 'vitest';
import { shouldDismissSheet } from './shouldDismissSheet';

describe('shouldDismissSheet', () => {
  it('dismisses past a quarter of the sheet height', () => {
    expect(shouldDismissSheet(101, 400, 0)).toBe(true);
    expect(shouldDismissSheet(99, 400, 0)).toBe(false);
  });

  it('dismisses a short fast downward flick', () => {
    expect(shouldDismissSheet(30, 400, 0.8)).toBe(true);
    expect(shouldDismissSheet(30, 400, 0.2)).toBe(false);
  });

  it('never dismisses a sheet pulled up or at rest', () => {
    expect(shouldDismissSheet(0, 400, 2)).toBe(false);
    expect(shouldDismissSheet(-8, 400, 2)).toBe(false);
  });
});

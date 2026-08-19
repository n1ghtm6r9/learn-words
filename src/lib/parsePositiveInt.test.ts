import { describe, expect, it } from 'vitest';
import { parsePositiveInt } from './parsePositiveInt';

describe('parsePositiveInt', () => {
  it('parses a valid integer within range', () => {
    expect(parsePositiveInt('5', 1, 10)).toBe(5);
  });

  it('accepts the boundary values', () => {
    expect(parsePositiveInt('1', 1, 10)).toBe(1);
    expect(parsePositiveInt('10', 1, 10)).toBe(10);
  });

  it('rejects values below the minimum', () => {
    expect(parsePositiveInt('0', 1, 10)).toBeNull();
  });

  it('rejects values above the maximum', () => {
    expect(parsePositiveInt('11', 1, 10)).toBeNull();
  });

  it('rejects non-integer numbers', () => {
    expect(parsePositiveInt('2.5', 1, 10)).toBeNull();
  });

  it('rejects empty or non-numeric strings', () => {
    expect(parsePositiveInt('', 1, 10)).toBeNull();
    expect(parsePositiveInt('abc', 1, 10)).toBeNull();
  });
});

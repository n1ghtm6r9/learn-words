import { describe, expect, it } from 'vitest';
import { rubberBandOffset } from './rubberBandOffset';

describe('rubberBandOffset', () => {
  it('follows a downward pull exactly', () => {
    expect(rubberBandOffset(0, 16)).toBe(0);
    expect(rubberBandOffset(120, 16)).toBe(120);
  });

  it('resists an upward pull and never passes the limit', () => {
    const small = rubberBandOffset(-10, 16);
    expect(small).toBeLessThan(0);
    expect(small).toBeGreaterThan(-10);
    expect(rubberBandOffset(-1000, 16)).toBeGreaterThan(-16);
  });
});

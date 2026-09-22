import { describe, expect, it } from 'vitest';
import { petalOffset } from './petalOffset';

describe('petalOffset', () => {
  it('starts the first petal straight above the centre', () => {
    expect(petalOffset(0, 12, 40)).toEqual({ x: 0, y: -40 });
  });

  it('goes clockwise, a quarter turn lands on the right', () => {
    expect(petalOffset(3, 12, 40)).toEqual({ x: 40, y: 0 });
  });

  it('puts the halfway petal straight below', () => {
    expect(petalOffset(6, 12, 40)).toEqual({ x: 0, y: 40 });
  });

  it('keeps every petal on the same circle', () => {
    for (let index = 0; index < 12; index++) {
      const { x, y } = petalOffset(index, 12, 40);
      expect(Math.hypot(x, y)).toBeCloseTo(40, 1);
    }
  });
});

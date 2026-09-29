import { describe, expect, it } from 'vitest';
import { hasScrolledAncestor } from './hasScrolledAncestor';

function tree() {
  const boundary = document.createElement('div');
  const scroller = document.createElement('div');
  const target = document.createElement('button');
  scroller.append(target);
  boundary.append(scroller);
  return { boundary, scroller, target };
}

describe('hasScrolledAncestor', () => {
  it('is false while every container is at the top', () => {
    const { boundary, target } = tree();
    expect(hasScrolledAncestor(target, boundary)).toBe(false);
  });

  it('is true when a container between the target and the boundary is scrolled', () => {
    const { boundary, scroller, target } = tree();
    scroller.scrollTop = 40;
    expect(hasScrolledAncestor(target, boundary)).toBe(true);
  });

  it('ignores scrolled elements outside the boundary', () => {
    const { boundary, target } = tree();
    const outside = document.createElement('div');
    outside.append(boundary);
    outside.scrollTop = 40;
    expect(hasScrolledAncestor(target, boundary)).toBe(false);
  });
});

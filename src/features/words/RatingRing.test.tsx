import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { RatingRing } from './RatingRing';

function progressCircle(container: HTMLElement) {
  return container.querySelectorAll('circle')[1];
}

describe('RatingRing', () => {
  it('draws a track under the rating arc', () => {
    const { container } = render(<RatingRing rating={30} color="red" />);

    expect(container.querySelectorAll('circle')).toHaveLength(2);
  });

  it('keeps the arc inside the ring for a rating outside 0-100', () => {
    const { container } = render(<RatingRing rating={140} color="green" />);

    expect(Number(progressCircle(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(0);
  });

  it('fills the ring in proportion to the rating', () => {
    const { container } = render(<RatingRing rating={50} color="yellow" />);
    const circle = progressCircle(container);
    const circumference = Number(circle.getAttribute('stroke-dasharray'));

    expect(Number(circle.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference / 2);
  });

  it('closes the ring completely at the top rating', () => {
    const { container } = render(<RatingRing rating={100} color="green" />);

    expect(Number(progressCircle(container).getAttribute('stroke-dashoffset'))).toBeCloseTo(0);
  });
});

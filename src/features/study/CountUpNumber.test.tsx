import { describe, expect, it } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { CountUpNumber } from './CountUpNumber';

describe('CountUpNumber', () => {
  it('starts from zero and counts up to the value', async () => {
    const { container } = render(<CountUpNumber value={42} />);

    expect(container).toHaveTextContent(/^0$/);
    await waitFor(() => expect(container).toHaveTextContent(/^42$/), { timeout: 2000 });
  });

  it('passes through intermediate whole numbers on the way', async () => {
    const seen = new Set<string>();
    const { container } = render(<CountUpNumber value={50} />);

    await waitFor(
      () => {
        seen.add(container.textContent ?? '');
        expect(container).toHaveTextContent(/^50$/);
      },
      { timeout: 2000, interval: 30 },
    );

    const between = [...seen].filter((text) => text !== '0' && text !== '50');
    expect(between.length).toBeGreaterThan(0);
    expect(between.every((text) => /^\d+$/.test(text))).toBe(true);
  });
});

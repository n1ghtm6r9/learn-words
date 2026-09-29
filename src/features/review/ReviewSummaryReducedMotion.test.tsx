import { beforeAll, describe, expect, it, vi } from 'vitest';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { render, screen } from '@testing-library/react';
import { ReviewSummary } from './ReviewSummary';
import { NewWordsSummary } from '@/features/newWords/NewWordsSummary';

function preferReducedMotion() {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

describe('summaries with reduced motion preferred', () => {
  beforeAll(() => {
    preferReducedMotion();
  });

  it('shows the final review numbers and accuracy at once', () => {
    render(<ReviewSummary correct={7} almost={2} wrong={3} onFinish={vi.fn()} />);

    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('58')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Точность' }).firstElementChild).toHaveStyle({ width: '58%' });
  });

  it('shows the final learned count at once', () => {
    render(<NewWordsSummary learnedCount={5} onFinish={vi.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

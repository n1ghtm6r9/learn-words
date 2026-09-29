import { describe, expect, it, vi } from 'vitest';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { render, screen, waitFor } from '@testing-library/react';
import { ReviewSummary } from './ReviewSummary';

describe('ReviewSummary', () => {
  it('names every count for screen readers right away', () => {
    render(<ReviewSummary correct={2} almost={1} wrong={1} onFinish={vi.fn()} />);

    expect(screen.getByText('Верно: 2')).toBeInTheDocument();
    expect(screen.getByText('Почти: 1')).toBeInTheDocument();
    expect(screen.getByText('Неверно: 1')).toBeInTheDocument();
  });

  it('shows accuracy as the share of correct answers', () => {
    render(<ReviewSummary correct={2} almost={1} wrong={1} onFinish={vi.fn()} />);

    const bar = screen.getByRole('progressbar', { name: 'Точность' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuetext', '50%');
  });

  it('counts the numbers up to their final values', async () => {
    render(<ReviewSummary correct={12} almost={0} wrong={4} onFinish={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('12')).toBeInTheDocument(), { timeout: 2500 });
    await waitFor(() => expect(screen.getByText('75')).toBeInTheDocument(), { timeout: 2500 });
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('leaves out accuracy when no answer was saved', () => {
    render(<ReviewSummary correct={0} almost={0} wrong={0} onFinish={vi.fn()} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});

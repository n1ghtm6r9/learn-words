import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsPage } from './StatsPage';
import { db } from '@/db/db';

describe('StatsPage', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
  });

  it('показывает количество выученных слов и точность', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.6,
      interval: 25,
      repetitions: 3,
      dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    });
    await db.reviews.add({ wordId: 1, reviewedAt: Date.now(), correct: true });

    render(<StatsPage />);

    expect(await screen.findByText(/Выучено слов: 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Точность за 7 дней: 100%/)).toBeInTheDocument();
  });
});

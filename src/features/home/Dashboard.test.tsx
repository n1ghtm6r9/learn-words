import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Dashboard } from './Dashboard';
import { db } from '@/db/db';

describe('Dashboard', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
  });

  it('показывает количество слов на сегодня и всего слов', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: Date.now() - 1000,
    });
    await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 5,
      repetitions: 1,
      dueDate: Date.now() + 10 * 24 * 60 * 60 * 1000,
    });

    render(<Dashboard />);

    expect(await screen.findByText(/Слов на сегодня: 1/)).toBeInTheDocument();
    expect(await screen.findByText(/Всего слов: 2/)).toBeInTheDocument();
  });

  it('кнопка "Учить" отключена, если на сегодня нечего повторять', async () => {
    render(<Dashboard />);
    const button = await screen.findByRole('button', { name: 'Учить' });
    expect(button).toBeDisabled();
  });
});

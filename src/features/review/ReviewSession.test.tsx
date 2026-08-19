import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewSession } from './ReviewSession';
import { db } from '@/db/db';
import { useUIStore } from '@/store/useUIStore';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

describe('ReviewSession', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ screen: 'review' });
  });

  it('показывает пустое состояние, если нечего повторять', async () => {
    render(<ReviewSession />);
    expect(await screen.findByText(/нечего повторять/i)).toBeInTheDocument();
  });

  it('проходит одно слово: перевод показан, слово скрыто, верный ответ обновляет рейтинг', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 70,
      reviewStreak: 0,
    });

    const user = userEvent.setup();
    render(<ReviewSession />);

    expect(await screen.findByText('привет')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Повторение завершено')).toBeInTheDocument();
    expect(screen.getByText('Верно: 1')).toBeInTheDocument();

    const stored = await db.words.toArray();
    expect(stored[0].rating).toBe(85);
    expect(stored[0].reviewStreak).toBe(1);
  });

  it('сортирует по рейтингу (худшее слово первым) и проходит несколько слов подряд', async () => {
    const now = Date.now();
    await db.words.add({
      term: 'strong',
      translation: 'сильный',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 90,
      reviewStreak: 5,
      lastReviewedAt: now,
    });
    await db.words.add({
      term: 'weak',
      translation: 'слабый',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 40,
      reviewStreak: 0,
      lastReviewedAt: now,
    });

    const user = userEvent.setup();
    render(<ReviewSession />);

    expect(await screen.findByText('слабый')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'nonsense');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Неверно');
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('сильный')).toBeInTheDocument();
    expect(screen.queryByLabelText('Слово')).toHaveValue('');
    await user.type(screen.getByLabelText('Слово'), 'strong');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Повторение завершено')).toBeInTheDocument();
    expect(screen.getByText('Верно: 1')).toBeInTheDocument();
    expect(screen.getByText('Неверно: 1')).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudySession } from './StudySession';
import { db } from '@/db/db';
import { useUIStore } from '@/store/useUIStore';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function StudyScreen() {
  const screen = useUIStore((s) => s.screen);
  return screen === 'study' ? <StudySession /> : <p>Главная</p>;
}

describe('StudySession', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.reviews.clear();
    useUIStore.setState({ session: null });
  });

  it('показывает сообщение, если на сегодня нет слов', async () => {
    render(<StudySession />);
    expect(await screen.findByText(/повторять нечего/i)).toBeInTheDocument();
  });

  it('очищает пустую сессию при возврате на главную, чтобы новое due-слово подхватилось при повторном входе', async () => {
    useUIStore.setState({ screen: 'study' });
    const user = userEvent.setup();
    render(<StudyScreen />);
    expect(await screen.findByText(/повторять нечего/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'На главную' }));
    expect(await screen.findByText('Главная')).toBeInTheDocument();

    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: Date.now() - 1000,
    });

    useUIStore.setState({ screen: 'study' });

    expect(await screen.findByLabelText('Перевод')).toBeInTheDocument();
  });

  it('проходит одну карточку: ответ -> фидбек -> далее -> итог сессии', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      easinessFactor: 2.5,
      interval: 0,
      repetitions: 0,
      dueDate: Date.now() - 1000,
    });

    const user = userEvent.setup();
    render(<StudySession />);

    await user.type(await screen.findByLabelText('Перевод'), 'привет');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');

    await user.click(screen.getByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Сессия завершена')).toBeInTheDocument();
    expect(screen.getByText('Верно: 1')).toBeInTheDocument();

    await waitFor(async () => {
      const reviews = await db.reviews.toArray();
      expect(reviews).toHaveLength(1);
      expect(reviews[0].correct).toBe(true);
    });
  });
});

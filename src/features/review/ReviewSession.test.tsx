import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

  it('shows the empty state when there is nothing to review', async () => {
    render(<ReviewSession />);
    expect(await screen.findByText(/нечего повторять/i)).toBeInTheDocument();
  });

  it('reviews one word: translation shown, word hidden, correct answer updates the rating without a manual Next click', async () => {
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

    expect(await screen.findByText('Повторение завершено')).toBeInTheDocument();
    expect(screen.getByText('Верно: 1')).toBeInTheDocument();

    const stored = await db.words.toArray();
    expect(stored[0].rating).toBe(80);
    expect(stored[0].reviewStreak).toBe(1);
  });

  it('sorts by rating (worst word first) and requires correcting a wrong answer before moving on', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await user.type(screen.getByLabelText('Слово'), 'weak');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByText('сильный')).toBeInTheDocument();
    expect(screen.queryByLabelText('Слово')).toHaveValue('');
    await user.type(screen.getByLabelText('Слово'), 'strong');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');

    expect(await screen.findByText('Повторение завершено')).toBeInTheDocument();
    expect(screen.getByText('Верно: 1')).toBeInTheDocument();
    expect(screen.getByText('Неверно: 1')).toBeInTheDocument();
  });

  it('keeps a mastered word out of the queue after it has decayed slightly below a perfect score', async () => {
    await db.words.add({
      term: 'mastered',
      translation: 'освоено',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 100,
      reviewStreak: 10,
      lastReviewedAt: Date.now() - 60 * 60 * 1000,
    });

    render(<ReviewSession />);

    expect(await screen.findByText(/нечего повторять/i)).toBeInTheDocument();
  });

  it('brings a mastered word back once it has decayed meaningfully', async () => {
    await db.words.add({
      term: 'faded',
      translation: 'подзабытое',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 100,
      reviewStreak: 10,
      lastReviewedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    });

    render(<ReviewSession />);

    expect(await screen.findByText('подзабытое')).toBeInTheDocument();
  });

  it('excludes a word with a perfect (100) rating from the review queue', async () => {
    await db.words.add({
      term: 'mastered',
      translation: 'освоено',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 100,
      reviewStreak: 10,
      lastReviewedAt: Date.now(),
    });

    render(<ReviewSession />);

    expect(await screen.findByText(/нечего повторять/i)).toBeInTheDocument();
  });

  it('a wrong answer that drops the rating to 0 sends the word back to relearning from scratch', async () => {
    const id = await db.words.add({
      term: 'faded',
      translation: 'забытое',
      createdAt: 0,
      kind: 'word',
      stage: 'review',
      learningPhase: 'B',
      phaseStreak: 0,
      rating: 10,
      reviewStreak: 0,
      lastReviewedAt: Date.now(),
    });

    const user = userEvent.setup();
    render(<ReviewSession />);

    await screen.findByText('забытое');
    await user.type(screen.getByLabelText('Слово'), 'nonsense');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Неверно');

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await user.type(screen.getByLabelText('Слово'), 'faded');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await waitFor(async () => {
      const word = await db.words.get(id);
      expect(word?.stage).toBe('new');
    });
    const word = await db.words.get(id);
    expect(word?.rating).toBe(0);
    expect(word?.learningPhase).toBe('A');
    expect(word?.phaseStreak).toBe(0);
  });
});

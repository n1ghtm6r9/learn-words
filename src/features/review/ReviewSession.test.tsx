import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewSession } from './ReviewSession';
import { db } from '@/db/db';
import { DAY_MS } from '@/lib/time';
import { DEFAULT_REVIEW_LIMIT } from '@/lib/reviewLimitRange';
import { useUIStore } from '@/store/useUIStore';
import type { Word } from '@/db/word.type';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function reviewWord(overrides: Partial<Word> & Pick<Word, 'term' | 'translation'>): Word {
  return {
    createdAt: 0,
    kind: 'word',
    stage: 'review',
    learningPhase: 'B',
    phaseStreak: 0,
    stability: 10,
    difficulty: 5,
    reviewStreak: 0,
    lastReviewedAt: Date.now() - 10 * DAY_MS,
    ...overrides,
  };
}

describe('ReviewSession', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ screen: 'review', reviewLimit: DEFAULT_REVIEW_LIMIT });
  });

  it('shows the empty state when there is nothing to review', async () => {
    render(<ReviewSession />);
    expect(await screen.findByText(/нечего повторять/i)).toBeInTheDocument();
  });

  it('reviews one word: translation shown, word hidden, a correct answer stretches its interval', async () => {
    await db.words.add(reviewWord({ term: 'hello', translation: 'привет', stability: 10 }));

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
    expect(stored[0].stability).toBeGreaterThan(10);
    expect(stored[0].reviewStreak).toBe(1);
  });

  it('shows the most-forgotten word first and requires correcting a wrong answer before moving on', async () => {
    const now = Date.now();
    await db.words.add(
      reviewWord({ term: 'strong', translation: 'сильный', stability: 10, lastReviewedAt: now - 11 * DAY_MS }),
    );
    await db.words.add(
      reviewWord({ term: 'weak', translation: 'слабый', stability: 2, lastReviewedAt: now - 30 * DAY_MS }),
    );

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

  it('offers a word that is not due yet as practice, and says so', async () => {
    await db.words.add(
      reviewWord({
        term: 'settled',
        translation: 'усвоено',
        stability: 90,
        lastReviewedAt: Date.now() - 5 * DAY_MS,
      }),
    );

    render(<ReviewSession />);

    expect(await screen.findByText('усвоено')).toBeInTheDocument();
    expect(screen.getByText(/с опережением/)).toBeInTheDocument();
  });

  it('does not mark a genuinely due word as practice', async () => {
    await db.words.add(
      reviewWord({ term: 'due', translation: 'пора', stability: 3, lastReviewedAt: Date.now() - 9 * DAY_MS }),
    );

    render(<ReviewSession />);

    expect(await screen.findByText('пора')).toBeInTheDocument();
    expect(screen.queryByText(/с опережением/)).not.toBeInTheDocument();
  });

  it('does not credit a correct answer given ahead of schedule', async () => {
    const lastReviewedAt = Date.now() - 5 * DAY_MS;
    const id = await db.words.add(
      reviewWord({ term: 'settled', translation: 'усвоено', stability: 90, lastReviewedAt }),
    );

    const user = userEvent.setup();
    render(<ReviewSession />);

    await screen.findByText('усвоено');
    await user.type(screen.getByLabelText('Слово'), 'settled');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    await screen.findByText('Повторение завершено');

    const word = await db.words.get(id);
    expect(word?.stability).toBe(90);
    expect(word?.reviewStreak).toBe(0);
    expect(word?.lastReviewedAt).toBe(lastReviewedAt);
  });

  it('still counts a mistake made ahead of schedule, because it is real evidence', async () => {
    const id = await db.words.add(
      reviewWord({
        term: 'settled',
        translation: 'усвоено',
        stability: 90,
        lastReviewedAt: Date.now() - 5 * DAY_MS,
      }),
    );

    const user = userEvent.setup();
    render(<ReviewSession />);

    await screen.findByText('усвоено');
    await user.type(screen.getByLabelText('Слово'), 'nonsense');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(await screen.findByTestId('feedback')).toHaveTextContent('Неверно');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await user.type(screen.getByLabelText('Слово'), 'settled');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByText('Повторение завершено');

    const word = await db.words.get(id);
    expect(word!.stability).toBeLessThan(90);
  });

  it('brings a word back once its interval has elapsed', async () => {
    await db.words.add(
      reviewWord({
        term: 'faded',
        translation: 'подзабытое',
        stability: 4,
        lastReviewedAt: Date.now() - 5 * DAY_MS,
      }),
    );

    render(<ReviewSession />);

    expect(await screen.findByText('подзабытое')).toBeInTheDocument();
  });

  it('caps a session at the configured number of words so a huge backlog stays workable', async () => {
    useUIStore.setState({ reviewLimit: 2 });
    const now = Date.now();
    for (let i = 0; i < 6; i++) {
      await db.words.add(
        reviewWord({
          term: `word${i}`,
          translation: `перевод${i}`,
          stability: 1,
          lastReviewedAt: now - (10 + i) * DAY_MS,
        }),
      );
    }

    render(<ReviewSession />);

    expect(await screen.findByText(/1 из 2/)).toBeInTheDocument();
  });

  it('sends a word nobody can hold on to back to relearning from scratch', async () => {
    const id = await db.words.add(
      reviewWord({
        term: 'faded',
        translation: 'забытое',
        stability: 0.25,
        difficulty: 9.6,
        lastReviewedAt: Date.now() - DAY_MS,
      }),
    );

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
    expect(word?.learningPhase).toBe('A');
    expect(word?.phaseStreak).toBe(0);
  });
});

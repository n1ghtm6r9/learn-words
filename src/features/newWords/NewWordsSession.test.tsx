import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWordsSession } from './NewWordsSession';
import { getDb } from '@/db/getDb';
import { createWord } from '@/db/createWord';
import { useUIStore } from '@/store/useUIStore';
import { DEFAULT_DIFFICULTY, INITIAL_STABILITY_DAYS } from '@/lib/memoryParams';
import { DAY_MS } from '@/lib/time';
import type { Word } from '@/db/word.type';

function learnedWord(term: string, translation: string, daysSinceReview: number): Word {
  return {
    ...createWord(term, translation),
    stage: 'review',
    stability: 5,
    lastReviewedAt: Date.now() - daysSinceReview * DAY_MS,
  };
}

const db = getDb('en');

describe('NewWordsSession', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ studyLanguage: 'en' });
    useUIStore.setState({ phaseARepeats: 1, phaseBRepeats: 1, screen: 'newWords' });
  });

  it('shows the empty state when there are no new words', async () => {
    render(<NewWordsSession />);
    expect(await screen.findByText('Нет новых слов — добавьте немного!')).toBeInTheDocument();
    expect(screen.queryByText('Выучено слов')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Начать повторение' })).not.toBeInTheDocument();
  });

  it('with no new words left shows how many are learned and due, and offers to review the due ones', async () => {
    await db.words.bulkAdd([
      learnedWord('one', 'один', 10),
      learnedWord('two', 'два', 7),
      learnedWord('three', 'три', 1),
    ]);
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('Нет новых слов — добавьте немного!');
    const learned = await screen.findByText('Выучено слов');
    expect(learned.nextElementSibling).toHaveTextContent('3');
    expect(screen.getByText('К повторению').nextElementSibling).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Добавить' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Начать повторение' }));
    expect(useUIStore.getState().screen).toBe('review');
  });

  it('does not offer a review when nothing learned is due yet', async () => {
    await db.words.add(learnedWord('one', 'один', 1));
    render(<NewWordsSession />);

    expect((await screen.findByText('К повторению')).nextElementSibling).toHaveTextContent('0');
    expect(screen.queryByRole('button', { name: 'Начать повторение' })).not.toBeInTheDocument();
  });

  it('labels learned words and fills the progress bar step by step', async () => {
    await db.words.add(createWord('hello', 'привет'));
    await db.words.add(createWord('cat', 'кот'));
    useUIStore.setState({ phaseARepeats: 1, phaseBRepeats: 1 });
    const user = userEvent.setup();
    render(<NewWordsSession />);

    expect(await screen.findByText('Выучено 0 из 2')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Прогресс занятия' });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '4');

    const terms: Record<string, string> = { привет: 'hello', кот: 'cat' };
    for (let answer = 0; answer < 3; answer++) {
      await screen.findByLabelText('Слово', {}, { timeout: 2000 });
      await waitFor(() => expect(screen.getAllByText(/^(привет|кот)$/)).toHaveLength(1));
      const shown = screen.getByText(/^(привет|кот)$/).textContent ?? '';
      await user.type(screen.getByLabelText('Слово'), terms[shown]);
      await user.click(screen.getByRole('button', { name: 'Проверить' }));
      await waitFor(() => expect(screen.queryByTestId('feedback')).not.toBeInTheDocument(), { timeout: 2000 });
    }

    expect(await screen.findByText('Выучено 1 из 2', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Прогресс занятия' })).toHaveAttribute('aria-valuenow', '3');
  });

  it('takes a word through Phase A and Phase B (1 repeat each) and moves it into review, without a manual Next click', async () => {
    await db.words.add(createWord('hello', 'привет'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await waitFor(() => expect(screen.queryByText('hello')).not.toBeInTheDocument(), { timeout: 2000 });

    expect(await screen.findByText('привет')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByText('Новые слова выучены')).toBeInTheDocument();
    expect(screen.getByText(/Выучено слов: 1/)).toBeInTheDocument();

    const stored = await db.words.toArray();
    expect(stored[0].stage).toBe('review');
    expect(stored[0].stability).toBe(INITIAL_STABILITY_DAYS);
    expect(stored[0].difficulty).toBe(DEFAULT_DIFFICULTY);
    expect(stored[0].lastReviewedAt).toBeDefined();
  });

  it('a wrong answer requires a correction and resets a non-zero phaseStreak', async () => {
    await db.words.add({ ...createWord('cat', 'кот'), phaseStreak: 2 });
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('cat');
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toBeInTheDocument();
    let stored = await db.words.toArray();
    expect(stored[0].phaseStreak).toBe(2);

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(screen.getByLabelText('Слово')).toHaveValue('');

    await user.type(screen.getByLabelText('Слово'), 'cat');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await waitFor(async () => {
      stored = await db.words.toArray();
      expect(stored[0].phaseStreak).toBe(0);
    });
    expect(stored[0].learningPhase).toBe('A');
  });

  it('a minor (almost) error does not advance and does not reset the streak', async () => {
    await db.words.add({ ...createWord('cat', 'кот'), phaseStreak: 1 });
    useUIStore.setState({ phaseARepeats: 5, phaseBRepeats: 5 });
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('cat');
    await user.type(screen.getByLabelText('Слово'), 'cot');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await user.type(screen.getByLabelText('Слово'), 'cat');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await waitFor(async () => {
      const stored = await db.words.toArray();
      expect(stored[0].phaseStreak).toBe(1);
    });
  });

  it('shows phase progress on the card', async () => {
    await db.words.add({ ...createWord('cat', 'кот'), phaseStreak: 1 });
    useUIStore.setState({ phaseARepeats: 3 });
    render(<NewWordsSession />);

    expect(await screen.findByText('Прогресс: 1 из 3')).toBeInTheDocument();
  });

  it('never shows the same word twice in a row', async () => {
    useUIStore.setState({ phaseARepeats: 10, phaseBRepeats: 10 });
    await db.words.add(createWord('one', 'один'));
    await db.words.add(createWord('two', 'два'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    const seenTranslations: string[] = [];
    for (let i = 0; i < 6; i++) {
      await screen.findByLabelText('Слово', {}, { timeout: 2000 });
      await waitFor(() => expect(screen.getAllByText(/^(один|два)$/)).toHaveLength(1));
      const node = screen.getByText(/^(один|два)$/);
      const shown = node.textContent ?? '';
      seenTranslations.push(shown);
      await user.type(screen.getByLabelText('Слово'), shown === 'один' ? 'one' : 'two');
      await user.click(screen.getByRole('button', { name: 'Проверить' }));
    }

    for (let i = 1; i < seenTranslations.length; i++) {
      expect(seenTranslations[i]).not.toBe(seenTranslations[i - 1]);
    }
  }, 20000);

  it('pressing Enter twice on the graduating correct flash does not double-count the learned word', async () => {
    await db.words.add(createWord('sun', 'солнце'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('sun');
    await user.type(screen.getByLabelText('Слово'), 'sun');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await waitFor(() => expect(screen.queryByLabelText('Слово')).not.toBeInTheDocument(), { timeout: 2000 });
    await screen.findByLabelText('Слово');
    await user.type(screen.getByLabelText('Слово'), 'sun');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await screen.findByTestId('feedback');
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(await screen.findByText('Новые слова выучены')).toBeInTheDocument();
    expect(screen.getByText(/Выучено слов: 1/)).toBeInTheDocument();
  });

  it('drops a word you do not want to learn and moves on to the next one', async () => {
    await db.words.add(createWord('hello', 'привет'));
    await db.words.add(createWord('cat', 'кот'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('Выучено 0 из 2');
    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await screen.findByText('Выучено 0 из 1');
    const remaining = await db.words.toArray();
    expect(remaining).toHaveLength(1);
  });

  it('keeps the word when the deletion is cancelled', async () => {
    await db.words.add(createWord('hello', 'привет'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('Выучено 0 из 1');
    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    await user.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(await screen.findByText('Выучено 0 из 1')).toBeInTheDocument();
    expect(await db.words.count()).toBe(1);
  });

  it('shows the empty state once the last unwanted word is gone', async () => {
    await db.words.add(createWord('hello', 'привет'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('Выучено 0 из 1');
    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(await screen.findByText('Нет новых слов — добавьте немного!')).toBeInTheDocument();
  });

  it('reports a failed deletion and keeps the word on screen', async () => {
    await db.words.add(createWord('hello', 'привет'));
    const deleteSpy = vi.spyOn(db.words, 'delete').mockRejectedValueOnce(new Error('db locked'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('Выучено 0 из 1');
    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    expect(await screen.findByText('Не удалось удалить слово. Попробуйте ещё раз.')).toBeInTheDocument();
    expect(await db.words.count()).toBe(1);

    deleteSpy.mockRestore();
  });
});

describe('NewWordsSession when the store changes underneath', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ studyLanguage: 'en', phaseARepeats: 1, phaseBRepeats: 1, screen: 'newWords', addWordOpen: false });
  });

  it('shows words that land in the store while the screen is open', async () => {
    render(<NewWordsSession />);
    await screen.findByText('Нет новых слов — добавьте немного!');

    await db.words.add(createWord('hello', 'привет'));

    expect(await screen.findByText('hello')).toBeInTheDocument();
  });

  it('drops a waiting word that disappears from the store and keeps the shown one', async () => {
    await db.words.add(createWord('cat', 'кот'));
    await db.words.add(createWord('dog', 'собака'));
    render(<NewWordsSession />);
    expect(await screen.findByText('Выучено 0 из 2')).toBeInTheDocument();

    const shown = screen.queryByText('cat') ? 'cat' : 'dog';
    const waiting = (await db.words.toArray()).find((word) => word.term !== shown);
    await db.words.delete(waiting!.id!);

    expect(await screen.findByText('Выучено 0 из 1')).toBeInTheDocument();
    expect(screen.getByText(shown)).toBeInTheDocument();
  });
});

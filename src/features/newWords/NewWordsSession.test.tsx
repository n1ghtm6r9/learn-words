import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWordsSession } from './NewWordsSession';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import { useUIStore } from '@/store/useUIStore';

describe('NewWordsSession', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ phaseARepeats: 1, phaseBRepeats: 1, screen: 'newWords' });
  });

  it('shows the empty state when there are no new words', async () => {
    render(<NewWordsSession />);
    expect(await screen.findByText('Нет новых слов — добавьте немного!')).toBeInTheDocument();
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
    expect(stored[0].rating).toBe(70);
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
      const node = screen.getByText(/^(один|два)$/);
      const shown = node.textContent ?? '';
      seenTranslations.push(shown);
      await user.type(screen.getByLabelText('Слово'), shown === 'один' ? 'one' : 'two');
      await user.click(screen.getByRole('button', { name: 'Проверить' }));
    }

    for (let i = 1; i < seenTranslations.length; i++) {
      expect(seenTranslations[i]).not.toBe(seenTranslations[i - 1]);
    }
  });

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
});

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

  it('takes a word through Phase A and Phase B (1 repeat each) and moves it into review', async () => {
    await db.words.add(createWord('hello', 'привет'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    await waitFor(() => expect(screen.queryByText('hello')).not.toBeInTheDocument());

    expect(await screen.findByText('привет')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Новые слова выучены')).toBeInTheDocument();
    expect(screen.getByText(/Выучено слов: 1/)).toBeInTheDocument();

    const stored = await db.words.toArray();
    expect(stored[0].stage).toBe('review');
    expect(stored[0].rating).toBe(70);
  });

  it('a wrong answer resets phaseStreak but does not advance the word', async () => {
    await db.words.add(createWord('cat', 'кот'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('cat');
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    expect(await screen.findByLabelText('Слово')).toHaveValue('');
    const stored = await db.words.toArray();
    expect(stored[0].learningPhase).toBe('A');
    expect(stored[0].phaseStreak).toBe(0);
  });

  it('resets the card and shows a fresh input field after a wrong answer', async () => {
    await db.words.add(createWord('cat', 'кот'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('cat');
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    expect(await screen.findByLabelText('Слово')).toHaveValue('');
  });

  it('interleaves words from the pool - the same word never repeats back to back', async () => {
    await db.words.add(createWord('one', 'один'));
    await db.words.add(createWord('two', 'два'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    const seenTerms: string[] = [];
    for (let i = 0; i < 4; i++) {
      await screen.findByLabelText('Слово');
      const termNode = screen.getByText(/^(one|two)$/);
      seenTerms.push(termNode.textContent ?? '');
      await user.type(screen.getByLabelText('Слово'), 'wrong');
      await user.click(screen.getByRole('button', { name: 'Проверить' }));
      await user.click(await screen.findByRole('button', { name: 'Далее' }));
    }

    for (let i = 1; i < seenTerms.length; i++) {
      expect(seenTerms[i]).not.toBe(seenTerms[i - 1]);
    }
  });

  it('double-clicking "Next" on the graduating answer does not double-count the learned word', async () => {
    await db.words.add(createWord('sun', 'солнце'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('sun');
    await user.type(screen.getByLabelText('Слово'), 'sun');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    await screen.findByLabelText('Слово');
    expect(screen.getByText('солнце')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'sun');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    const nextButton = await screen.findByRole('button', { name: 'Далее' });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(await screen.findByText('Новые слова выучены')).toBeInTheDocument();
    expect(screen.getByText(/Выучено слов: 1/)).toBeInTheDocument();
  });
});

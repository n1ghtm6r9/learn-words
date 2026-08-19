import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordList } from './WordList';
import { db } from '@/db/db';

function baseWord(overrides: Partial<Parameters<typeof db.words.add>[0]>) {
  return {
    term: 'hello',
    translation: 'привет',
    createdAt: 0,
    kind: 'word' as const,
    stage: 'new' as const,
    learningPhase: 'A' as const,
    phaseStreak: 0,
    rating: 0,
    reviewStreak: 0,
    ...overrides,
  };
}

describe('WordList', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('shows the list of saved words', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    render(<WordList />);

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(await screen.findByText('cat')).toBeInTheDocument();
  });

  it('filters by search text', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('hello');

    await user.type(screen.getByPlaceholderText('Поиск...'), 'cat');

    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('finds a word by its translation, not just its term', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('hello');

    await user.type(screen.getByPlaceholderText('Поиск...'), 'кот');

    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('finds a word typed with a curly apostrophe that was folded on save', async () => {
    await db.words.add(baseWord({ term: "don't", translation: 'не' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText("don't");

    await user.type(screen.getByPlaceholderText('Поиск...'), 'don’t');

    expect(screen.getByText("don't")).toBeInTheDocument();
    expect(screen.queryByText('Ничего не найдено.')).not.toBeInTheDocument();
  });

  it('finds a phrase typed with doubled spaces', async () => {
    await db.words.add(baseWord({ term: 'good morning', translation: 'доброе утро' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('good morning');

    await user.type(screen.getByPlaceholderText('Поиск...'), 'good  morning');

    expect(screen.getByText('good morning')).toBeInTheDocument();
  });

  it('lists words in alphabetical order regardless of insertion order', async () => {
    await db.words.add(baseWord({ term: 'zebra', translation: 'зебра' }));
    await db.words.add(baseWord({ term: 'apple', translation: 'яблоко' }));
    await db.words.add(baseWord({ term: 'mango', translation: 'манго' }));

    render(<WordList />);
    await screen.findByText('apple');

    const terms = screen.getAllByText(/^(zebra|apple|mango)$/).map((n) => n.textContent);
    expect(terms).toEqual(['apple', 'mango', 'zebra']);
  });

  it('shows how many words there are in total', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    render(<WordList />);

    expect(await screen.findByText('Всего слов: 2')).toBeInTheDocument();
  });

  it('shows how many words the search narrowed the list down to', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('Всего слов: 2');

    await user.type(screen.getByPlaceholderText('Поиск...'), 'cat');

    expect(screen.getByText('Показано: 1 из 2')).toBeInTheDocument();
  });

  it('opens a details view with the full term and translation when a card is clicked', async () => {
    await db.words.add(
      baseWord({
        term: 'at the end of my tether',
        translation: 'быть на пределе терпения',
        kind: 'phrase',
        stage: 'review',
        rating: 90,
        reviewStreak: 5,
        lastReviewedAt: Date.now(),
      }),
    );

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('at the end of my tether');

    await user.click(screen.getByRole('button', { name: /Открыть подробности/ }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('at the end of my tether')).toBeInTheDocument();
    expect(within(dialog).getByText('быть на пределе терпения')).toBeInTheDocument();
    expect(within(dialog).getByText('На повторении')).toBeInTheDocument();
    expect(within(dialog).getByText('90.00')).toBeInTheDocument();
  });

  it('deletes a word via the button after confirming', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('hello');

    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(await db.words.count()).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(async () => {
      expect(await db.words.count()).toBe(0);
    });
  });

  it('opens the export dialog from the Export button', async () => {
    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByPlaceholderText('Поиск...');

    expect(screen.queryByText('Экспорт данных')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Экспорт' }));

    expect(await screen.findByText('Экспорт данных')).toBeInTheDocument();
  });

  it('opens the import dialog from the Import button', async () => {
    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByPlaceholderText('Поиск...');

    expect(screen.queryByText('Импорт данных')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Импорт' }));

    expect(await screen.findByText('Импорт данных')).toBeInTheDocument();
  });
});

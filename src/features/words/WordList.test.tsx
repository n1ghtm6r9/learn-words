import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordList } from './WordList';
import { db } from '@/db/db';

function baseWord(overrides: Partial<Parameters<typeof db.words.add>[0]>) {
  return {
    term: 'hello',
    translation: 'привет',
    createdAt: 0,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: 0,
    ...overrides,
  };
}

describe('WordList', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('показывает список сохранённых слов', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    render(<WordList />);

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(await screen.findByText('cat')).toBeInTheDocument();
  });

  it('фильтрует по тексту поиска', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));
    await db.words.add(baseWord({ term: 'cat', translation: 'кот' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('hello');

    await user.type(screen.getByPlaceholderText('Поиск...'), 'cat');

    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
  });

  it('удаляет слово по кнопке', async () => {
    await db.words.add(baseWord({ term: 'hello', translation: 'привет' }));

    const user = userEvent.setup();
    render(<WordList />);
    await screen.findByText('hello');

    await user.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(async () => {
      expect(await db.words.count()).toBe(0);
    });
  });
});

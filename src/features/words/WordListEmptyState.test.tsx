import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordList } from './WordList';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';

const db = getDb('en');

describe('WordList empty state', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ studyLanguage: 'en', addWordOpen: false });
  });

  it('offers to add the first word and opens the add dialog', async () => {
    const user = userEvent.setup();
    render(<WordList />);

    await user.click(await screen.findByRole('button', { name: 'Добавить' }));

    expect(useUIStore.getState().addWordOpen).toBe(true);
  });

  it('gives the search field the id the hotkey targets', async () => {
    render(<WordList />);

    expect(await screen.findByPlaceholderText('Поиск...')).toHaveAttribute('id', 'word-search');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkAddForm } from './BulkAddForm';
import { db } from '@/db/db';

describe('BulkAddForm', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('parses lines, shows a preview, and saves all valid pairs', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<BulkAddForm onDone={onDone} />);

    await user.type(
      screen.getByLabelText('Список слов'),
      'hello - привет{Enter}cat - кот{Enter}bad line without delimiter',
    );

    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
    expect(screen.getByText('cat')).toBeInTheDocument();
    expect(screen.getByText(/bad line without delimiter/, { ignore: 'script, style, textarea' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сохранить всё' }));

    const words = await db.words.toArray();
    expect(words).toHaveLength(2);
    expect(words.map((w) => w.term).sort()).toEqual(['cat', 'hello']);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('drops duplicate terms pasted within the same batch and reports how many were skipped', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<BulkAddForm onDone={onDone} />);

    await user.type(
      screen.getByLabelText('Список слов'),
      'cat - кот{Enter}cat - кот{Enter}CAT - котик{Enter}dog - собака',
    );

    await screen.findByText('dog');
    expect(screen.getByText(/Пропущено дубликатов: 2/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сохранить всё' }));

    const words = await db.words.toArray();
    expect(words).toHaveLength(2);
    expect(words.map((w) => w.term).sort()).toEqual(['cat', 'dog']);
  });

  it('skips terms that already exist in the dictionary when saving', async () => {
    await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      stability: 1,
      difficulty: 5,
      reviewStreak: 0,
    });

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<BulkAddForm onDone={onDone} />);

    await user.type(screen.getByLabelText('Список слов'), 'cat - кот{Enter}dog - собака');
    await user.click(await screen.findByRole('button', { name: 'Сохранить всё' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    const words = await db.words.toArray();
    expect(words).toHaveLength(2);
    expect(words.map((w) => w.term).sort()).toEqual(['cat', 'dog']);
  });

  it('recognizes an existing word even when the pasted line is wrapped in quotes and spaces', async () => {
    await db.words.add({
      term: 'good morning',
      translation: 'доброе утро',
      createdAt: 0,
      kind: 'phrase',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      stability: 1,
      difficulty: 5,
      reviewStreak: 0,
    });

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<BulkAddForm onDone={onDone} />);

    await user.type(screen.getByLabelText('Список слов'), '" \'good morning\' " - доброе утро');
    await user.click(await screen.findByRole('button', { name: 'Сохранить всё' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
  });

  it('disables the save button when there are no valid pairs', async () => {
    const user = userEvent.setup();
    render(<BulkAddForm onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Список слов'), 'нет разделителя вообще');

    expect(await screen.findByRole('button', { name: 'Сохранить всё' })).toBeDisabled();
  });

  it('does not duplicate the entry when clicked again while saving', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<BulkAddForm onDone={onDone} />);

    await user.type(screen.getByLabelText('Список слов'), 'hello - привет');

    const saveButton = await screen.findByRole('button', { name: 'Сохранить всё' });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    await waitFor(() => expect(onDone).toHaveBeenCalled());

    const words = await db.words.toArray();
    expect(words).toHaveLength(1);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('shows a message on save error without blocking the form', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    const bulkAddSpy = vi.spyOn(db.words, 'bulkAdd').mockRejectedValueOnce(new Error('quota'));

    render(<BulkAddForm onDone={onDone} />);

    await user.type(screen.getByLabelText('Список слов'), 'hello - привет');
    await user.click(await screen.findByRole('button', { name: 'Сохранить всё' }));

    expect(await screen.findByText(/не удалось сохранить/i)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Сохранить всё' })).not.toBeDisabled();

    bulkAddSpy.mockRestore();
  });
});

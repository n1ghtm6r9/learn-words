import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordForm } from './WordForm';
import { db } from '@/db/db';

describe('WordForm', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('creates a word and calls onDone', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.type(screen.getByLabelText('Перевод'), 'привет');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const words = await db.words.toArray();
      expect(words).toHaveLength(1);
      expect(words[0].term).toBe('hello');
      expect(words[0].kind).toBe('word');
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('shows a duplicate warning and requires a second confirming press to save', async () => {
    await db.words.add({
      term: 'hello',
      translation: 'привет',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.type(screen.getByLabelText('Перевод'), 'приветствие');

    expect(await screen.findByText(/уже есть в словаре/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Сохранить всё равно' }));
    expect(await db.words.count()).toBe(1);
    expect(onDone).not.toHaveBeenCalled();

    await user.click(await screen.findByRole('button', { name: 'Сохранить всё равно' }));
    await waitFor(async () => {
      expect(await db.words.count()).toBe(2);
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('does not block saving a genuinely new word (no duplicate)', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'unique');
    await user.type(screen.getByLabelText('Перевод'), 'уникальный');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(await db.words.count()).toBe(1);
  });

  it('editing a term into collision with another word warns before saving', async () => {
    await db.words.add({
      term: 'dog',
      translation: 'собака',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });
    const catId = await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });
    const existing = (await db.words.get(catId))!;

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="edit" word={existing} onDone={onDone} />);

    const termInput = screen.getByLabelText('Слово');
    await user.clear(termInput);
    await user.type(termInput, 'dog');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText(/уже есть в словаре/i)).toBeInTheDocument();
    const stillCat = await db.words.get(catId);
    expect(stillCat?.term).toBe('cat');

    await user.click(await screen.findByRole('button', { name: 'Сохранить всё равно' }));
    await waitFor(async () => {
      const updated = await db.words.get(catId);
      expect(updated?.term).toBe('dog');
    });
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('editing a word without changing its term does not warn about colliding with itself', async () => {
    const id = await db.words.add({
      term: 'fox',
      translation: 'лиса',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });
    const existing = (await db.words.get(id))!;

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="edit" word={existing} onDone={onDone} />);

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(screen.queryByText(/уже есть в словаре/i)).not.toBeInTheDocument();
  });

  it('a double-tap on Save does not create two rows', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'once');
    await user.type(screen.getByLabelText('Перевод'), 'однажды');

    const saveButton = screen.getByRole('button', { name: 'Сохранить' });
    fireEvent.click(saveButton);
    fireEvent.click(saveButton);

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(await db.words.count()).toBe(1);
  });

  it('updates the existing word in edit mode', async () => {
    const id = await db.words.add({
      term: 'cat',
      translation: 'кот',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });
    const existing = (await db.words.get(id))!;

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="edit" word={existing} onDone={onDone} />);

    const translationInput = screen.getByLabelText('Перевод');
    await user.clear(translationInput);
    await user.type(translationInput, 'котик');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const updated = await db.words.get(id);
      expect(updated?.translation).toBe('котик');
    });
  });

  it('recalculates kind in edit mode when the word becomes a phrase', async () => {
    const id = await db.words.add({
      term: 'good',
      translation: 'хороший',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });
    const existing = (await db.words.get(id))!;

    const user = userEvent.setup();
    render(<WordForm mode="edit" word={existing} onDone={vi.fn()} />);

    const termInput = screen.getByLabelText('Слово');
    await user.type(termInput, ' morning');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const updated = await db.words.get(id);
      expect(updated?.term).toBe('good morning');
      expect(updated?.kind).toBe('phrase');
    });
  });

  it('does not treat a phrasal verb as a phrase in edit mode', async () => {
    const id = await db.words.add({
      term: 'give',
      translation: 'давать',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      rating: 0,
      reviewStreak: 0,
    });
    const existing = (await db.words.get(id))!;

    const user = userEvent.setup();
    render(<WordForm mode="edit" word={existing} onDone={vi.fn()} />);

    const termInput = screen.getByLabelText('Слово');
    await user.type(termInput, ' up');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const updated = await db.words.get(id);
      expect(updated?.term).toBe('give up');
      expect(updated?.kind).toBe('word');
    });
  });
});

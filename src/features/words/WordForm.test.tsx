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

  it('saves a term whose casing rules break IndexedDB range queries', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'ჩემი');
    await user.type(screen.getByLabelText('Перевод'), 'мой');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    const words = await db.words.toArray();
    expect(words.map((w) => w.term)).toEqual(['ჩემი']);
  });

  it('reports a save failure instead of silently losing the word', async () => {
    const addSpy = vi.spyOn(db.words, 'add').mockRejectedValueOnce(new Error('quota'));
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'boom');
    await user.type(screen.getByLabelText('Перевод'), 'бум');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText(/не удалось сохранить слово/i)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
    addSpy.mockRestore();
  });

  it('explains why a punctuation-only term is refused instead of doing nothing', async () => {
    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), '...');
    await user.type(screen.getByLabelText('Перевод'), '123');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(await screen.findByText(/хотя бы одна буква/i)).toBeInTheDocument();
    expect(await db.words.count()).toBe(0);
    expect(onDone).not.toHaveBeenCalled();
  });

  it('normalizes the term when saving an edit, not just a plain trim', async () => {
    const id = await db.words.add({
      term: 'morning',
      translation: 'утро',
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
    await user.clear(termInput);
    await user.type(termInput, 'good   morning');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const updated = await db.words.get(id);
      expect(updated?.term).toBe('good morning');
    });
  });

  it('re-checks for a duplicate when the term changes while a save is in flight', async () => {
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

    const onDone = vi.fn();
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={onDone} />);

    await user.type(screen.getByLabelText('Слово'), 'cat');
    await user.type(screen.getByLabelText('Перевод'), 'кошка');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());

    await user.clear(screen.getByLabelText('Слово'));
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: /Сохранить/ }));

    expect(await screen.findByText(/уже есть в словаре/i)).toBeInTheDocument();
    expect(await db.words.where('term').equals('dog').count()).toBe(1);
  });

  it('clears the validation message as soon as the term is corrected', async () => {
    const user = userEvent.setup();
    render(<WordForm mode="create" onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Слово'), '...');
    await user.type(screen.getByLabelText('Перевод'), 'кот');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    expect(await screen.findByText(/хотя бы одна буква/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'cat');

    expect(screen.queryByText(/хотя бы одна буква/i)).not.toBeInTheDocument();
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

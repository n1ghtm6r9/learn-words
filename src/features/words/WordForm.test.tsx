import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordForm } from './WordForm';
import { db } from '@/db/db';

describe('WordForm', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('создаёт слово и вызывает onDone', async () => {
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

  it('показывает предупреждение о дубликате, но не блокирует сохранение', async () => {
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

    await user.click(screen.getByRole('button', { name: 'Сохранить' }));
    await waitFor(async () => {
      expect(await db.words.count()).toBe(2);
    });
  });

  it('в режиме edit обновляет существующее слово', async () => {
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

  it('в режиме edit пересчитывает kind, если слово превращается в словосочетание', async () => {
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

  it('в режиме edit не считает фразовый глагол фразой', async () => {
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

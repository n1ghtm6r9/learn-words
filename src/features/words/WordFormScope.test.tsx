import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordForm } from './WordForm';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';

const db = getDb('en');

describe('WordForm with folders and tags', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', lastUsedFolderId: null });
  });

  it('saves a new word into the chosen folder', async () => {
    await db.folders.add({ name: 'work', color: 'blue', order: 1 });

    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.type(screen.getByLabelText('Слово'), 'meeting');
    await userEvent.type(screen.getByLabelText('Перевод'), 'встреча');
    await userEvent.click(await screen.findByLabelText('Папка'));
    await userEvent.click(await screen.findByRole('option', { name: 'work' }));
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const saved = await db.words.where('term').equals('meeting').first();
      expect(saved?.folderId).toBeDefined();
    });
  });

  it('remembers the folder for the next word', async () => {
    await db.folders.add({ name: 'work', color: 'blue', order: 1 });

    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.type(screen.getByLabelText('Слово'), 'meeting');
    await userEvent.type(screen.getByLabelText('Перевод'), 'встреча');
    await userEvent.click(await screen.findByLabelText('Папка'));
    await userEvent.click(await screen.findByRole('option', { name: 'work' }));
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(() => expect(useUIStore.getState().lastUsedFolderId).not.toBeNull());
  });

  it('links the chosen tags to a new word', async () => {
    const tagId = await db.tags.add({ name: 'nouns', color: 'blue', order: 1 });

    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.type(screen.getByLabelText('Слово'), 'table');
    await userEvent.type(screen.getByLabelText('Перевод'), 'стол');
    await userEvent.click(await screen.findByRole('button', { name: /nouns/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      expect(await db.wordTags.where('tagId').equals(tagId as number).count()).toBe(1);
    });
  });

  it('replaces the tags of an edited word', async () => {
    const keptId = await db.tags.add({ name: 'kept', color: 'blue', order: 1 });
    const droppedId = await db.tags.add({ name: 'dropped', color: 'green', order: 2 });
    const wordId = await db.words.add({
      term: 'change',
      translation: 'менять',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      stability: 1,
      difficulty: 5,
      reviewStreak: 0,
    });
    await db.wordTags.bulkAdd([
      { wordId: wordId as number, tagId: keptId as number },
      { wordId: wordId as number, tagId: droppedId as number },
    ]);

    const word = await db.words.get(wordId as number);
    render(<WordForm mode="edit" word={word} onDone={() => {}} />);

    await userEvent.click(await screen.findByRole('button', { name: /dropped/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const links = await db.wordTags.where('wordId').equals(wordId as number).toArray();
      expect(links.map((link) => link.tagId)).toEqual([keptId]);
    });
  });

  it('offers the folder picker even before any folder exists', async () => {
    render(<WordForm mode="create" onDone={() => {}} />);

    expect(await screen.findByLabelText('Папка')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Новая папка' })).toBeInTheDocument();
  });

  it('creates a folder from the form and puts the word into it', async () => {
    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Слово' }), 'meeting');
    await userEvent.type(screen.getByRole('textbox', { name: 'Перевод' }), 'встреча');

    await userEvent.click(await screen.findByRole('button', { name: 'Новая папка' }));
    await userEvent.type(await screen.findByLabelText('Новая папка'), 'Работа{Enter}');

    await waitFor(async () => {
      expect(await db.folders.where('name').equals('Работа').count()).toBe(1);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const saved = await db.words.where('term').equals('meeting').first();
      expect(saved?.folderId).toBeDefined();
    });
  });

  it('gives a new folder the colour that was picked', async () => {
    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Новая папка' }));
    await userEvent.type(await screen.findByLabelText('Новая папка'), 'Зелёная');
    await userEvent.click(screen.getByRole('button', { name: /^Цвет:/ }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Зелёный' }));
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(async () => {
      const folder = await db.folders.where('name').equals('Зелёная').first();
      expect(folder?.color).toBe('green');
    });
  });

  it('gives a new tag the colour that was picked', async () => {
    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Новый тег' }));
    await userEvent.type(await screen.findByLabelText('Новый тег'), 'важное');
    await userEvent.click(screen.getByRole('button', { name: /^Цвет:/ }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Фиолетовый' }));
    await userEvent.click(screen.getByRole('button', { name: 'Создать' }));

    await waitFor(async () => {
      const tag = await db.tags.where('name').equals('важное').first();
      expect(tag?.color).toBe('purple');
    });
  });
});

describe('WordForm live query resilience', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', lastUsedFolderId: null });
  });

  it('keeps the unsaved tag choice when another word is tagged elsewhere', async () => {
    const tagId = await db.tags.add({ name: 'hard', color: 'blue', order: 1 });
    const editedId = await db.words.add({
      term: 'edited',
      translation: 'правится',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      stability: 1,
      difficulty: 5,
      reviewStreak: 0,
    });
    const otherId = await db.words.add({
      term: 'other',
      translation: 'другое',
      createdAt: 0,
      kind: 'word',
      stage: 'new',
      learningPhase: 'A',
      phaseStreak: 0,
      stability: 1,
      difficulty: 5,
      reviewStreak: 0,
    });
    await db.wordTags.add({ wordId: editedId as number, tagId: tagId as number });

    const word = await db.words.get(editedId as number);
    render(<WordForm mode="edit" word={word} onDone={() => {}} />);

    const chip = await screen.findByRole('button', { name: /hard/ });
    await waitFor(() => expect(chip).toHaveAttribute('aria-pressed', 'true'));

    await userEvent.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    await db.wordTags.add({ wordId: otherId as number, tagId: tagId as number });

    await waitFor(async () => {
      expect(await db.wordTags.where('tagId').equals(tagId as number).count()).toBe(2);
    });
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('WordForm tag creation', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', lastUsedFolderId: null });
  });

  it('creates a tag from the form and applies it to the word', async () => {
    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Слово' }), 'table');
    await userEvent.type(screen.getByRole('textbox', { name: 'Перевод' }), 'стол');

    await userEvent.click(await screen.findByRole('button', { name: 'Новый тег' }));
    await userEvent.type(await screen.findByLabelText('Новый тег'), 'мебель{Enter}');

    await waitFor(async () => {
      expect(await db.tags.where('name').equals('мебель').count()).toBe(1);
    });

    await userEvent.click(screen.getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      const saved = await db.words.where('term').equals('table').first();
      expect(saved).toBeDefined();
      expect(await db.wordTags.where('wordId').equals(saved!.id!).count()).toBe(1);
    });
  });

  it('refuses a tag name that is already taken', async () => {
    await db.tags.add({ name: 'taken', color: 'blue', order: 1 });

    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Новый тег' }));
    await userEvent.type(await screen.findByLabelText('Новый тег'), 'taken');

    expect(await screen.findByText('Тег с таким названием уже есть')).toBeInTheDocument();
    expect(await db.tags.count()).toBe(1);
  });
});

describe('WordForm folder select icons', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', lastUsedFolderId: null });
  });

  it('shows a folder icon next to every folder in the select', async () => {
    await db.folders.add({ name: 'work', color: 'pink', order: 1 });

    render(<WordForm mode="create" onDone={() => {}} />);

    await userEvent.click(await screen.findByLabelText('Папка'));
    const option = await screen.findByRole('option', { name: 'work' });
    expect(option.querySelector('svg.lucide-folder')).not.toBeNull();
  });

  it('shows the chosen folder with its icon in the closed select', async () => {
    const folderId = await db.folders.add({ name: 'work', color: 'pink', order: 1 });
    useUIStore.setState({ lastUsedFolderId: folderId as number });

    render(<WordForm mode="create" onDone={() => {}} />);

    const trigger = await screen.findByLabelText('Папка');
    await waitFor(() => expect(trigger).toHaveTextContent('work'));
    expect(trigger.querySelector('svg.lucide-folder')).not.toBeNull();
  });
});

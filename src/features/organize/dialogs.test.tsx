import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FoldersDialog } from './FoldersDialog';
import { TagsDialog } from './TagsDialog';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';

const db = getDb('en');

function word(term: string, folderId?: number) {
  return {
    term,
    translation: term,
    createdAt: 0,
    kind: 'word' as const,
    stage: 'new' as const,
    learningPhase: 'A' as const,
    phaseStreak: 0,
    stability: 1,
    difficulty: 5,
    reviewStreak: 0,
    ...(folderId == null ? {} : { folderId }),
  };
}

describe('FoldersDialog', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en' });
  });

  it('holds only the folders, never the tags', async () => {
    await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    await db.tags.add({ name: 'verbs', color: 'green', order: 1 });

    render(<FoldersDialog open onOpenChange={() => {}} />);

    expect(await screen.findByText('work')).toBeInTheDocument();
    expect(screen.queryByText('verbs')).not.toBeInTheDocument();
  });

  it('creates a folder and counts its words', async () => {
    const folderId = await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    await db.words.add(word('meeting', folderId as number));

    render(<FoldersDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('work')).closest('li')!;
    expect(within(row).getByText('1')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Название папки'), 'travel');
    await userEvent.click(screen.getByRole('button', { name: 'Новая папка' }));

    await waitFor(async () => {
      expect(await db.folders.count()).toBe(2);
    });
  });

  it('keeps the words of a deleted folder', async () => {
    const folderId = await db.folders.add({ name: 'doomed', color: 'blue', order: 1 });
    const wordId = await db.words.add(word('kept', folderId as number));

    render(<FoldersDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('doomed')).closest('li')!;
    await userEvent.click(within(row).getByLabelText('Удалить папку'));
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }));

    await waitFor(async () => {
      expect(await db.folders.count()).toBe(0);
    });
    expect((await db.words.get(wordId as number))?.folderId).toBeUndefined();
  });
});

describe('TagsDialog', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en' });
  });

  it('holds only the tags, never the folders', async () => {
    await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    await db.tags.add({ name: 'verbs', color: 'green', order: 1 });

    render(<TagsDialog open onOpenChange={() => {}} />);

    expect(await screen.findByText('verbs')).toBeInTheDocument();
    expect(screen.queryByText('work')).not.toBeInTheDocument();
  });

  it('drops the links of a deleted tag but keeps the word', async () => {
    const tagId = await db.tags.add({ name: 'doomed', color: 'blue', order: 1 });
    const wordId = await db.words.add(word('tagged'));
    await db.wordTags.add({ wordId: wordId as number, tagId: tagId as number });

    render(<TagsDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('doomed')).closest('li')!;
    await userEvent.click(within(row).getByLabelText('Удалить тег'));
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }));

    await waitFor(async () => {
      expect(await db.wordTags.count()).toBe(0);
    });
    expect(await db.words.get(wordId as number)).toBeDefined();
  });

  it('gives every row a drag handle to reorder with', async () => {
    await db.tags.add({ name: 'first', color: 'blue', order: 1 });
    await db.tags.add({ name: 'second', color: 'green', order: 2 });

    render(<TagsDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('second')).closest('li')!;
    expect(row).toHaveAttribute('data-reorder-id');
    expect(within(row).getByRole('button', { name: /second/ })).toBeInTheDocument();
  });
});

async function pickColor(scope: HTMLElement, colour: string) {
  await userEvent.click(within(scope).getByRole('button', { name: /^Цвет:/ }));
  await userEvent.click(await screen.findByRole('radio', { name: colour }));
}

describe('choosing a colour on creation', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en' });
  });

  it('opens the whole palette as a flower from a single swatch', async () => {
    render(<FoldersDialog open onOpenChange={() => {}} />);

    expect(screen.queryByRole('radiogroup', { name: 'Цвет' })).not.toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: /^Цвет:/ }));

    const flower = await screen.findByRole('radiogroup', { name: 'Цвет' });
    expect(within(flower).getAllByRole('radio')).toHaveLength(12);
  });

  it('closes the flower and shows the new colour on the swatch after a pick', async () => {
    render(<FoldersDialog open onOpenChange={() => {}} />);

    await pickColor(document.body, 'Розовый');

    await waitFor(() => expect(screen.queryByRole('radiogroup', { name: 'Цвет' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Цвет: Розовый' })).toBeInTheDocument();
  });

  it('creates a folder in the colour picked before pressing add', async () => {
    render(<FoldersDialog open onOpenChange={() => {}} />);

    await userEvent.type(await screen.findByLabelText('Название папки'), 'Кухня');
    await pickColor(document.body, 'Розовый');
    await userEvent.click(screen.getByRole('button', { name: 'Новая папка' }));

    await waitFor(async () => {
      expect((await db.folders.where('name').equals('Кухня').first())?.color).toBe('pink');
    });
  });

  it('suggests a different colour for the next folder', async () => {
    await db.folders.add({ name: 'first', color: 'red', order: 1 });

    render(<FoldersDialog open onOpenChange={() => {}} />);

    expect(await screen.findByRole('button', { name: 'Цвет: Оранжевый' })).toBeInTheDocument();
  });

  it('creates a tag in the colour picked before pressing add', async () => {
    render(<TagsDialog open onOpenChange={() => {}} />);

    await userEvent.type(await screen.findByLabelText('Название тега'), 'срочно');
    await pickColor(document.body, 'Бирюзовый');
    await userEvent.click(screen.getByRole('button', { name: 'Новый тег' }));

    await waitFor(async () => {
      expect((await db.tags.where('name').equals('срочно').first())?.color).toBe('teal');
    });
  });

  it('keeps the old colour when renaming is cancelled', async () => {
    await db.folders.add({ name: 'keep', color: 'blue', order: 1 });

    render(<FoldersDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('keep')).closest('li')!;
    await userEvent.click(within(row).getByLabelText('Переименовать папку'));
    const editing = screen.getByRole('textbox', { name: 'Переименовать папку' }).closest('li')!;
    await pickColor(editing, 'Красный');
    await userEvent.click(within(editing).getByRole('button', { name: 'Отмена' }));

    expect((await db.folders.where('name').equals('keep').first())?.color).toBe('blue');
  });

  it('applies the new colour together with the name on save', async () => {
    await db.folders.add({ name: 'recolour', color: 'blue', order: 1 });

    render(<FoldersDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('recolour')).closest('li')!;
    await userEvent.click(within(row).getByLabelText('Переименовать папку'));
    const editing = screen.getByRole('textbox', { name: 'Переименовать папку' }).closest('li')!;
    await pickColor(editing, 'Индиго');
    await userEvent.click(within(editing).getByRole('button', { name: 'Сохранить' }));

    await waitFor(async () => {
      expect((await db.folders.where('name').equals('recolour').first())?.color).toBe('indigo');
    });
  });
});

describe('deleting a tag', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en' });
  });

  it('warns visibly that the tag comes off every word before deleting', async () => {
    const tagId = (await db.tags.add({ name: 'verbs', color: 'blue', order: 1 })) as number;
    for (const term of ['run', 'walk', 'jump']) {
      const wordId = (await db.words.add(word(term))) as number;
      await db.wordTags.add({ wordId, tagId });
    }

    render(<TagsDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('verbs')).closest('li')!;
    await userEvent.click(within(row).getByLabelText('Удалить тег'));

    expect(await screen.findByText('Удалить тег «verbs»? Он снимется со всех слов, где стоит: 3.')).toBeVisible();
  });

  it('takes the tag off every word but keeps the words', async () => {
    const tagId = (await db.tags.add({ name: 'verbs', color: 'blue', order: 1 })) as number;
    const keptTagId = (await db.tags.add({ name: 'kept', color: 'green', order: 2 })) as number;
    const ids: number[] = [];
    for (const term of ['run', 'walk', 'jump']) {
      const wordId = (await db.words.add(word(term))) as number;
      ids.push(wordId);
      await db.wordTags.add({ wordId, tagId });
    }
    await db.wordTags.add({ wordId: ids[0], tagId: keptTagId });

    render(<TagsDialog open onOpenChange={() => {}} />);

    const row = (await screen.findByText('verbs')).closest('li')!;
    await userEvent.click(within(row).getByLabelText('Удалить тег'));
    await userEvent.click(await screen.findByRole('button', { name: 'Удалить' }));

    await waitFor(async () => {
      expect(await db.wordTags.where('tagId').equals(tagId).count()).toBe(0);
    });
    expect(await db.words.count()).toBe(3);
    expect(await db.wordTags.where('tagId').equals(keptTagId).count()).toBe(1);
    expect(await db.tags.get(tagId)).toBeUndefined();
  });
});

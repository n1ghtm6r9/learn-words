import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordList } from './WordList';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';

const db = getDb('en');

function baseWord(overrides: Partial<Parameters<typeof db.words.add>[0]>) {
  return {
    term: 'hello',
    translation: 'привет',
    createdAt: 0,
    kind: 'word' as const,
    stage: 'new' as const,
    learningPhase: 'A' as const,
    phaseStreak: 0,
    stability: 1,
    difficulty: 5,
    reviewStreak: 0,
    ...overrides,
  };
}

describe('WordList folder and tag filter', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en' });
  });

  it('shows the folder of a word next to it', async () => {
    const folderId = await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    await db.words.add(baseWord({ term: 'meeting', translation: 'встреча', folderId }));

    render(<WordList />);

    const row = (await screen.findByText('meeting')).closest('li')!;
    expect(within(row).getByText('work')).toBeInTheDocument();
  });

  it('keeps only the words of the chosen folder', async () => {
    const folderId = await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    await db.words.add(baseWord({ term: 'meeting', translation: 'встреча', folderId }));
    await db.words.add(baseWord({ term: 'loose', translation: 'свободный' }));

    render(<WordList />);
    expect(await screen.findByText('loose')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /work/ }));

    await waitFor(() => expect(screen.queryByText('loose')).not.toBeInTheDocument());
    expect(screen.getByText('meeting')).toBeInTheDocument();
  });

  it('keeps only the words carrying the chosen tag', async () => {
    const tagId = await db.tags.add({ name: 'verbs', color: 'blue', order: 1 });
    const taggedId = await db.words.add(baseWord({ term: 'run', translation: 'бежать' }));
    await db.words.add(baseWord({ term: 'table', translation: 'стол' }));
    await db.wordTags.add({ wordId: taggedId as number, tagId: tagId as number });

    render(<WordList />);
    expect(await screen.findByText('table')).toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: /verbs/ }));

    await waitFor(() => expect(screen.queryByText('table')).not.toBeInTheDocument());
    expect(screen.getByText('run')).toBeInTheDocument();
  });

  it('falls back to every folder once the chosen one is deleted', async () => {
    const folderId = await db.folders.add({ name: 'temporary', color: 'blue', order: 1 });
    await db.words.add(baseWord({ term: 'inside', translation: 'внутри', folderId }));
    await db.words.add(baseWord({ term: 'outside', translation: 'снаружи' }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: /temporary/ }));
    await waitFor(() => expect(screen.queryByText('outside')).not.toBeInTheDocument());

    await db.folders.delete(folderId as number);

    expect(await screen.findByText('outside')).toBeInTheDocument();
  });
});

async function openSheet(action: string) {
  await userEvent.click(screen.getByRole('button', { name: action }));
  return screen.findByRole('dialog');
}

describe('WordList bulk selection', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', selectingWords: false });
  });

  it('moves the selected words into a folder', async () => {
    await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    await db.words.add(baseWord({ term: 'meeting', translation: 'встреча' }));
    await db.words.add(baseWord({ term: 'table', translation: 'стол' }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'meeting' }));
    const sheet = await openSheet('В папку');
    await userEvent.click(within(sheet).getByRole('button', { name: /work/ }));

    await waitFor(async () => {
      const moved = await db.words.where('term').equals('meeting').first();
      expect(moved?.folderId).toBeDefined();
    });
    const untouched = await db.words.where('term').equals('table').first();
    expect(untouched?.folderId).toBeUndefined();
  });

  it('tags every word of the current filter through select all', async () => {
    const tagId = await db.tags.add({ name: 'nouns', color: 'green', order: 1 });
    await db.words.add(baseWord({ term: 'table', translation: 'стол' }));
    await db.words.add(baseWord({ term: 'chair', translation: 'стул' }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать все' }));
    expect(screen.getByText('Выбрано 2 из 2')).toBeInTheDocument();
    const sheet = await openSheet('Добавить тег');
    await userEvent.click(within(sheet).getByRole('button', { name: /nouns/ }));

    await waitFor(async () => {
      expect(await db.wordTags.where('tagId').equals(tagId as number).count()).toBe(2);
    });
  });

  it('turns select all into deselect all once everything is ticked', async () => {
    await db.words.add(baseWord({ term: 'table', translation: 'стол' }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать все' }));
    await userEvent.click(screen.getByRole('button', { name: 'Снять выделение' }));

    expect(screen.getByText('Отметьте слова')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'В папку' })).toBeDisabled();
  });

  it('leaves the selection mode once the action is done', async () => {
    await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    await db.words.add(baseWord({ term: 'meeting', translation: 'встреча' }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'meeting' }));
    const sheet = await openSheet('В папку');
    await userEvent.click(within(sheet).getByRole('button', { name: /work/ }));

    await waitFor(() => expect(screen.queryByRole('checkbox', { name: 'meeting' })).not.toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Выбрать' })).toBeInTheDocument();
  });

  it('puts moved words back where they were on undo', async () => {
    const work = (await db.folders.add({ name: 'work', color: 'blue', order: 1 })) as number;
    const travel = (await db.folders.add({ name: 'travel', color: 'green', order: 2 })) as number;
    await db.words.add(baseWord({ term: 'meeting', translation: 'встреча', folderId: work }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'meeting' }));
    const sheet = await openSheet('В папку');
    await userEvent.click(within(sheet).getByRole('button', { name: /travel/ }));

    await waitFor(async () => expect((await db.words.toArray())[0].folderId).toBe(travel));
    await userEvent.click(await screen.findByRole('button', { name: 'Отменить' }));

    await waitFor(async () => expect((await db.words.toArray())[0].folderId).toBe(work));
  });

  it('deletes the selection at once and brings it back on undo', async () => {
    const tagId = (await db.tags.add({ name: 'verbs', color: 'blue', order: 1 })) as number;
    const runId = (await db.words.add(baseWord({ term: 'run', translation: 'бежать' }))) as number;
    await db.words.add(baseWord({ term: 'walk', translation: 'идти' }));
    await db.words.add(baseWord({ term: 'table', translation: 'стол' }));
    await db.wordTags.add({ wordId: runId, tagId });

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'run' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'walk' }));
    await userEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(async () => expect(await db.words.count()).toBe(1));
    expect(await screen.findByText('Удалено слов: 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Отменить' }));

    await waitFor(async () => expect(await db.words.count()).toBe(3));
    expect(await db.wordTags.where('wordId').equals(runId).count()).toBe(1);
  });

  it('offers to remove only the tags the selected words actually carry', async () => {
    const verbs = (await db.tags.add({ name: 'verbs', color: 'blue', order: 1 })) as number;
    await db.tags.add({ name: 'unused', color: 'green', order: 2 });
    const runId = (await db.words.add(baseWord({ term: 'run', translation: 'бежать' }))) as number;
    await db.words.add(baseWord({ term: 'walk', translation: 'идти' }));
    await db.wordTags.add({ wordId: runId, tagId: verbs });

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать все' }));
    const sheet = await openSheet('Убрать тег');

    expect(within(sheet).getByRole('button', { name: /verbs/ })).toHaveTextContent('у 1 из 2');
    expect(within(sheet).queryByRole('button', { name: /unused/ })).not.toBeInTheDocument();
  });

  it('does not offer to add a tag every selected word already has', async () => {
    const verbs = (await db.tags.add({ name: 'verbs', color: 'blue', order: 1 })) as number;
    const runId = (await db.words.add(baseWord({ term: 'run', translation: 'бежать' }))) as number;
    await db.wordTags.add({ wordId: runId, tagId: verbs });

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'run' }));
    const sheet = await openSheet('Добавить тег');

    expect(within(sheet).getByRole('button', { name: /verbs/ })).toBeDisabled();
  });

  it('drops the tag links of a word deleted from the list', async () => {
    const tagId = await db.tags.add({ name: 'doomed', color: 'orange', order: 1 });
    const wordId = await db.words.add(baseWord({ term: 'gone', translation: 'ушёл' }));
    await db.wordTags.add({ wordId: wordId as number, tagId: tagId as number });

    render(<WordList />);
    const row = (await screen.findByText('gone')).closest('li')!;
    await userEvent.click(within(row).getByLabelText('Удалить'));
    await userEvent.click(within(row).getByRole('button', { name: 'Удалить' }));

    await waitFor(async () => {
      expect(await db.wordTags.where('wordId').equals(wordId as number).count()).toBe(0);
    });
  });
});

describe('WordList stale selection', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', selectingWords: false });
  });

  it('forgets the selection when the folder filter changes', async () => {
    const folderId = await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    const otherId = await db.folders.add({ name: 'travel', color: 'blue', order: 2 });
    await db.words.add(baseWord({ term: 'meeting', translation: 'встреча', folderId: folderId as number }));
    await db.words.add(baseWord({ term: 'airport', translation: 'аэропорт', folderId: otherId as number }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'meeting' }));
    expect(screen.getByText('Выбрано 1 из 2')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /travel/ }));

    await waitFor(() => expect(screen.getByText('Отметьте слова')).toBeInTheDocument());
  });

  it('never touches words hidden by the current filter', async () => {
    const workId = await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    const travelId = await db.folders.add({ name: 'travel', color: 'blue', order: 2 });
    await db.tags.add({ name: 'hard', color: 'blue', order: 1 });
    const hiddenId = await db.words.add(
      baseWord({ term: 'meeting', translation: 'встреча', folderId: workId as number }),
    );
    await db.words.add(baseWord({ term: 'airport', translation: 'аэропорт', folderId: travelId as number }));

    render(<WordList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Выбрать' }));
    await userEvent.click(await screen.findByRole('checkbox', { name: 'meeting' }));

    await userEvent.click(screen.getByRole('button', { name: /travel/ }));
    await waitFor(() => expect(screen.queryByText('meeting')).not.toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Добавить тег' })).toBeDisabled();
    expect(await db.wordTags.where('wordId').equals(hiddenId as number).count()).toBe(0);
  });
});

describe('WordList tag management entry', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', tagsOpen: false, foldersOpen: false });
  });

  it('opens the tags popup from the gear next to the tag chips', async () => {
    await db.tags.add({ name: 'verbs', color: 'blue', order: 1 });
    await db.words.add(baseWord({ term: 'run', translation: 'бежать' }));

    render(<WordList />);

    await userEvent.click(await screen.findByRole('button', { name: 'Управление тегами' }));
    expect(useUIStore.getState().tagsOpen).toBe(true);
    expect(useUIStore.getState().foldersOpen).toBe(false);
  });

  it('opens the folders popup from the gear next to the folder chips', async () => {
    await db.words.add(baseWord({ term: 'run', translation: 'бежать' }));

    render(<WordList />);

    await userEvent.click(await screen.findByRole('button', { name: 'Управление папками' }));
    expect(useUIStore.getState().foldersOpen).toBe(true);
  });
});

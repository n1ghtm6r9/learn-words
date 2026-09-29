import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from './ImportDialog';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';

const db = getDb('en');

function jsonFile(content: unknown, name = 'import.json'): File {
  return new File([JSON.stringify(content)], name, { type: 'application/json' });
}

describe('ImportDialog', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en' });
  });

  it('shows a summary with the word count and settings presence after choosing a valid file', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({
      version: 2,
      exportedAt: 0,
      words: [{ term: 'cat', translation: 'кот' }],
      settings: { theme: 'dark' },
    });

    await user.upload(screen.getByLabelText('Выберите файл'), file);

    expect(await screen.findByText('Найдено слов: 1, есть настройки')).toBeInTheDocument();
  });

  it('shows an error message for a file that is not valid JSON', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = new File(['not json'], 'bad.json', { type: 'application/json' });
    await user.upload(screen.getByLabelText('Выберите файл'), file);

    expect(await screen.findByText('Не удалось прочитать файл. Проверьте формат.')).toBeInTheDocument();
  });

  it('only shows checkboxes for categories actually present in the file', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);

    await screen.findByText('Найдено слов: 1');
    expect(screen.getByRole('checkbox', { name: 'Слова, прогресс, папки и теги' })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'Настройки' })).not.toBeInTheDocument();
  });

  it('imports the words and shows a success message on confirm', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({
      version: 2,
      exportedAt: 0,
      words: [
        { term: 'cat', translation: 'кот' },
        { term: 'dog', translation: 'собака' },
      ],
    });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 2');

    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    expect(await screen.findByText('Импортировано слов: 2')).toBeInTheDocument();
    const words = await db.words.toArray();
    expect(words.map((w) => w.term).sort()).toEqual(['cat', 'dog']);
  });

  it('disables the confirm button when there is nothing importable', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 2, exportedAt: 0 });
    await user.upload(screen.getByLabelText('Выберите файл'), file);

    await screen.findByText('Найдено слов: 0');
    expect(screen.getByRole('button', { name: 'Импортировать' })).toBeDisabled();
  });

  it('reports a failure instead of silently pretending the import worked', async () => {
    const bulkAddSpy = vi.spyOn(db.words, 'bulkAdd').mockRejectedValueOnce(new Error('quota'));
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    expect(await screen.findByText(/не удалось сохранить импорт/i)).toBeInTheDocument();
    expect(screen.queryByText(/Импортировано слов/)).not.toBeInTheDocument();
    bulkAddSpy.mockRestore();
  });

  it('says how many words were skipped as already present, instead of just reporting zero', async () => {
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

    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    expect(await screen.findByText('Импортировано слов: 0')).toBeInTheDocument();
    expect(screen.getByText('Пропущено (уже в словаре): 1')).toBeInTheDocument();
  });

  it('confirms that settings were applied even when no words came along', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 2, exportedAt: 0, settings: { phaseARepeats: 7 } });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 0, есть настройки');

    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    expect(await screen.findByText('Настройки применены')).toBeInTheDocument();
  });

  it('restores progress onto an existing word when the replace option is ticked', async () => {
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

    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({
      version: 2,
      exportedAt: 0,
      words: [{ term: 'cat', translation: 'кот', stage: 'review', stability: 42, difficulty: 4, reviewStreak: 9 }],
    });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('checkbox', { name: 'Заменить прогресс уже существующих слов' }));
    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    expect(await screen.findByText('Обновлён прогресс: 1')).toBeInTheDocument();
    const [word] = await db.words.toArray();
    expect(word.stability).toBe(42);
    expect(word.stage).toBe('review');
  });

  it('offers a way to dismiss the dialog once the import is done', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={onOpenChange} />);

    const file = jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('button', { name: 'Импортировать' }));
    await screen.findByText('Импортировано слов: 1');

    expect(screen.queryByRole('button', { name: 'Импортировать' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Готово' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('forgets the previous file once the dialog is closed', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ImportDialog open onOpenChange={onOpenChange} />);

    const file = jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
    rerender(<ImportDialog open={false} onOpenChange={onOpenChange} />);
    rerender(<ImportDialog open onOpenChange={onOpenChange} />);

    expect(screen.queryByText('Найдено слов: 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Импортировать' })).not.toBeInTheDocument();
  });

  it('counts the folders and tags in the file and imports a file that only has them', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({
      version: 4,
      exportedAt: 0,
      words: [],
      folders: [{ name: 'Travel', color: 'blue', order: 1 }],
      tags: [
        { name: 'verbs', color: 'green', order: 1 },
        { name: 'often', color: 'amber', order: 2 },
      ],
    });
    await user.upload(screen.getByLabelText('Выберите файл'), file);

    expect(await screen.findByText('Папок: 1, тегов: 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    await screen.findByText('Импортировано слов: 0');
    expect((await db.folders.toArray()).map((folder) => folder.name)).toEqual(['Travel']);
    expect(await db.tags.count()).toBe(2);
  });

  it('loads the initial chat file and shows its summary', async () => {
    const loadInitialFile = vi.fn(() =>
      Promise.resolve(jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] }, 'chat.json')),
    );
    render(<ImportDialog open onOpenChange={vi.fn()} loadInitialFile={loadInitialFile} />);

    expect(await screen.findByText('Найдено слов: 1')).toBeInTheDocument();
    expect(screen.getByText('chat.json')).toBeInTheDocument();
    expect(loadInitialFile).toHaveBeenCalledOnce();
  });

  it('shows an alert when the chat file cannot be fetched', async () => {
    render(<ImportDialog open onOpenChange={vi.fn()} loadInitialFile={() => Promise.reject(new Error('nope'))} />);

    expect(
      await screen.findByText('Не удалось получить файл из чата. Выберите его вручную.'),
    ).toBeInTheDocument();
  });

  it('lets a manually picked file win over a late chat file', async () => {
    let resolveChatFile: (file: File) => void = () => {};
    const loadInitialFile = () => new Promise<File>((resolve) => (resolveChatFile = resolve));
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} loadInitialFile={loadInitialFile} />);

    expect(screen.getByText('Загружаем файл из чата…')).toBeInTheDocument();
    await user.upload(
      screen.getByLabelText('Выберите файл'),
      jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'a', translation: 'b' }] }, 'manual.json'),
    );
    await screen.findByText('Найдено слов: 1');

    resolveChatFile(
      jsonFile({ version: 2, exportedAt: 0, words: [{ term: 'a', translation: 'b' }, { term: 'c', translation: 'd' }] }, 'chat.json'),
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(screen.getByText('manual.json')).toBeInTheDocument();
    expect(screen.queryByText('Найдено слов: 2')).not.toBeInTheDocument();
  });
});


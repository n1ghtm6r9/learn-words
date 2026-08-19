import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ImportDialog } from './ImportDialog';
import { db } from '@/db/db';

function jsonFile(content: unknown, name = 'import.json'): File {
  return new File([JSON.stringify(content)], name, { type: 'application/json' });
}

describe('ImportDialog', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('shows a summary with the word count and settings presence after choosing a valid file', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({
      version: 1,
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

    const file = jsonFile({ version: 1, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);

    await screen.findByText('Найдено слов: 1');
    expect(screen.getByRole('checkbox', { name: 'Слова и прогресс' })).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: 'Настройки' })).not.toBeInTheDocument();
  });

  it('imports the words and shows a success message on confirm', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({
      version: 1,
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

    const file = jsonFile({ version: 1, exportedAt: 0 });
    await user.upload(screen.getByLabelText('Выберите файл'), file);

    await screen.findByText('Найдено слов: 0');
    expect(screen.getByRole('button', { name: 'Импортировать' })).toBeDisabled();
  });

  it('reports a failure instead of silently pretending the import worked', async () => {
    const bulkAddSpy = vi.spyOn(db.words, 'bulkAdd').mockRejectedValueOnce(new Error('quota'));
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 1, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
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
      rating: 0,
      reviewStreak: 0,
    });

    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 1, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    expect(await screen.findByText('Импортировано слов: 0')).toBeInTheDocument();
    expect(screen.getByText('Пропущено (уже в словаре): 1')).toBeInTheDocument();
  });

  it('confirms that settings were applied even when no words came along', async () => {
    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({ version: 1, exportedAt: 0, settings: { phaseARepeats: 7 } });
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
      rating: 0,
      reviewStreak: 0,
    });

    const user = userEvent.setup();
    render(<ImportDialog open onOpenChange={vi.fn()} />);

    const file = jsonFile({
      version: 1,
      exportedAt: 0,
      words: [{ term: 'cat', translation: 'кот', stage: 'review', rating: 88, reviewStreak: 9 }],
    });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('checkbox', { name: 'Заменить прогресс уже существующих слов' }));
    await user.click(screen.getByRole('button', { name: 'Импортировать' }));

    expect(await screen.findByText('Обновлён прогресс: 1')).toBeInTheDocument();
    const [word] = await db.words.toArray();
    expect(word.rating).toBe(88);
    expect(word.stage).toBe('review');
  });

  it('forgets the previous file once the dialog is closed', async () => {
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<ImportDialog open onOpenChange={onOpenChange} />);

    const file = jsonFile({ version: 1, exportedAt: 0, words: [{ term: 'cat', translation: 'кот' }] });
    await user.upload(screen.getByLabelText('Выберите файл'), file);
    await screen.findByText('Найдено слов: 1');

    await user.click(screen.getByRole('button', { name: 'Закрыть' }));
    rerender(<ImportDialog open={false} onOpenChange={onOpenChange} />);
    rerender(<ImportDialog open onOpenChange={onOpenChange} />);

    expect(screen.queryByText('Найдено слов: 1')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Импортировать' })).not.toBeInTheDocument();
  });
});

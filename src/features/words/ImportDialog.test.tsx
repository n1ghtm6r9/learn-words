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
});

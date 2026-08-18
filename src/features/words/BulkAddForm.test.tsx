import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkAddForm } from './BulkAddForm';
import { db } from '@/db/db';

describe('BulkAddForm', () => {
  beforeEach(async () => {
    await db.words.clear();
  });

  it('разбирает строки, показывает превью и сохраняет все валидные пары', async () => {
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

  it('кнопка сохранения отключена, если нет ни одной валидной пары', async () => {
    const user = userEvent.setup();
    render(<BulkAddForm onDone={vi.fn()} />);

    await user.type(screen.getByLabelText('Список слов'), 'нет разделителя вообще');

    expect(await screen.findByRole('button', { name: 'Сохранить всё' })).toBeDisabled();
  });

  it('повторный клик во время сохранения не дублирует запись', async () => {
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

  it('ошибка сохранения показывает сообщение и не блокирует форму', async () => {
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

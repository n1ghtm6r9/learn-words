import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from './ExportDialog';
import { db } from '@/db/db';

describe('ExportDialog', () => {
  beforeEach(async () => {
    await db.words.clear();
    URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = vi.fn();
  });

  it('shows both checkboxes checked by default', () => {
    render(<ExportDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByRole('checkbox', { name: 'Слова и прогресс' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Настройки' })).toBeChecked();
  });

  it('disables the confirm button only when both checkboxes are unchecked', async () => {
    const user = userEvent.setup();
    render(<ExportDialog open onOpenChange={vi.fn()} />);

    const confirmButton = screen.getByRole('button', { name: 'Скачать' });
    expect(confirmButton).not.toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Слова и прогресс' }));
    expect(confirmButton).not.toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'Настройки' }));
    expect(confirmButton).toBeDisabled();
  });

  it('triggers a download and closes the dialog when confirmed', async () => {
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

    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ExportDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Скачать' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(URL.createObjectURL).toHaveBeenCalledOnce();
  });

  it('writes the words and settings the checkboxes actually selected', async () => {
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
    render(<ExportDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('checkbox', { name: 'Настройки' }));
    await user.click(screen.getByRole('button', { name: 'Скачать' }));

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledOnce());
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
    const payload = JSON.parse(await blob.text());

    expect(payload.settings).toBeUndefined();
    expect(payload.words).toHaveLength(1);
    expect(payload.words[0]).toMatchObject({ term: 'cat', translation: 'кот' });
    expect(payload.words[0]).not.toHaveProperty('id');
  });

  it('reports a failure instead of silently closing when the export cannot be built', async () => {
    const toArraySpy = vi.spyOn(db.words, 'toArray').mockRejectedValueOnce(new Error('db locked'));
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(<ExportDialog open onOpenChange={onOpenChange} />);

    await user.click(screen.getByRole('button', { name: 'Скачать' }));

    expect(await screen.findByText(/не удалось выгрузить/i)).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    toArraySpy.mockRestore();
  });
});

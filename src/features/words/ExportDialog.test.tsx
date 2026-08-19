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
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

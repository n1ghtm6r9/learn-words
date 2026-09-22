import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BulkAddForm } from './BulkAddForm';
import { getDb } from '@/db/getDb';
import { useUIStore } from '@/store/useUIStore';

const db = getDb('en');

describe('BulkAddForm folder handling', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({ studyLanguage: 'en', lastUsedFolderId: null });
  });

  it('never drops a batch into the last used folder on its own', async () => {
    const folderId = await db.folders.add({ name: 'work', color: 'blue', order: 1 });
    useUIStore.setState({ lastUsedFolderId: folderId as number });

    render(<BulkAddForm onDone={() => {}} />);

    await userEvent.type(screen.getByLabelText('Список слов'), 'table = стол');
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить всё' }));

    await waitFor(async () => {
      expect(await db.words.count()).toBe(1);
    });
    const saved = await db.words.where('term').equals('table').first();
    expect(saved?.folderId).toBeUndefined();
  });

  it('puts the whole batch into the folder that was picked', async () => {
    const folderId = await db.folders.add({ name: 'work', color: 'blue', order: 1 });

    render(<BulkAddForm onDone={() => {}} />);

    await userEvent.type(screen.getByLabelText('Список слов'), 'table = стол\nchair = стул');
    await userEvent.click(await screen.findByLabelText('Папка'));
    await userEvent.click(await screen.findByRole('option', { name: 'work' }));
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить всё' }));

    await waitFor(async () => {
      expect(await db.words.where('folderId').equals(folderId as number).count()).toBe(2);
    });
  });
});

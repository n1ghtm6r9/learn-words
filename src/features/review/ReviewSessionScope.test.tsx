import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReviewSession } from './ReviewSession';
import { getDb } from '@/db/getDb';
import { DAY_MS } from '@/lib/time';
import { DEFAULT_REVIEW_LIMIT } from '@/lib/reviewLimitRange';
import { useUIStore } from '@/store/useUIStore';
import type { Word } from '@/db/word.type';

const db = getDb('en');

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

function reviewWord(overrides: Partial<Word> & Pick<Word, 'term' | 'translation'>): Word {
  return {
    createdAt: 0,
    kind: 'word',
    stage: 'review',
    learningPhase: 'B',
    phaseStreak: 0,
    stability: 10,
    difficulty: 5,
    reviewStreak: 0,
    lastReviewedAt: Date.now() - 10 * DAY_MS,
    ...overrides,
  };
}

describe('ReviewSession folder and tag filter', () => {
  beforeEach(async () => {
    await db.words.clear();
    await db.folders.clear();
    await db.tags.clear();
    await db.wordTags.clear();
    useUIStore.setState({
      studyLanguage: 'en',
      screen: 'review',
      reviewLimit: DEFAULT_REVIEW_LIMIT,
      reviewFolderFilter: 'all',
      reviewTagFilter: [],
    });
  });

  it('shows no filter bar while there are no folders or tags', async () => {
    await db.words.add(reviewWord({ term: 'hello', translation: 'привет' }));

    render(<ReviewSession />);

    expect(await screen.findByText('привет')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Все' })).not.toBeInTheDocument();
  });

  it('reviews only the words of the chosen folder', async () => {
    const folderId = (await db.folders.add({ name: 'work', color: 'blue', order: 1 })) as number;
    await db.words.add(reviewWord({ term: 'meeting', translation: 'встреча', folderId }));
    await db.words.add(reviewWord({ term: 'table', translation: 'стол', stability: 1 }));

    render(<ReviewSession />);
    expect(await screen.findByText(/1 из 2/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /work/ }));

    expect(await screen.findByText(/1 из 1/)).toBeInTheDocument();
    expect(screen.getByText('встреча')).toBeInTheDocument();
  });

  it('reviews only the words carrying the chosen tag', async () => {
    const tagId = (await db.tags.add({ name: 'verbs', color: 'green', order: 1 })) as number;
    const runId = (await db.words.add(reviewWord({ term: 'run', translation: 'бежать' }))) as number;
    await db.words.add(reviewWord({ term: 'table', translation: 'стол', stability: 1 }));
    await db.wordTags.add({ wordId: runId, tagId });

    render(<ReviewSession />);
    await screen.findByText(/1 из 2/);

    await userEvent.click(screen.getByRole('button', { name: /verbs/ }));

    expect(await screen.findByText(/1 из 1/)).toBeInTheDocument();
    expect(screen.getByText('бежать')).toBeInTheDocument();
  });

  it('applies the session limit after the filter, not before', async () => {
    useUIStore.setState({ reviewLimit: 2 });
    const folderId = (await db.folders.add({ name: 'work', color: 'blue', order: 1 })) as number;
    for (let i = 0; i < 3; i++) {
      await db.words.add(reviewWord({ term: `work${i}`, translation: `работа${i}`, folderId }));
    }
    for (let i = 0; i < 5; i++) {
      await db.words.add(
        reviewWord({ term: `faded${i}`, translation: `забыто${i}`, stability: 1, lastReviewedAt: Date.now() - 40 * DAY_MS }),
      );
    }

    render(<ReviewSession />);
    await screen.findByText(/забыто/);

    await userEvent.click(screen.getByRole('button', { name: /work/ }));

    expect(await screen.findByText(/1 из 2/)).toBeInTheDocument();
    expect(screen.getByText(/работа\d/)).toBeInTheDocument();
  });

  it('explains an empty filter and offers to show everything again', async () => {
    await db.folders.add({ name: 'empty', color: 'blue', order: 1 });
    await db.words.add(reviewWord({ term: 'hello', translation: 'привет' }));

    render(<ReviewSession />);
    await screen.findByText('привет');

    await userEvent.click(screen.getByRole('button', { name: /empty/ }));
    expect(await screen.findByText('В выбранной папке и тегах пока нечего повторять.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Показать все' }));
    expect(await screen.findByText('привет')).toBeInTheDocument();
  });

  it('keeps the chosen folder when the screen is left and opened again', async () => {
    const folderId = (await db.folders.add({ name: 'work', color: 'blue', order: 1 })) as number;
    await db.words.add(reviewWord({ term: 'meeting', translation: 'встреча', folderId }));
    await db.words.add(reviewWord({ term: 'table', translation: 'стол', stability: 1 }));

    const first = render(<ReviewSession />);
    await screen.findByText(/1 из 2/);
    await userEvent.click(screen.getByRole('button', { name: /work/ }));
    await screen.findByText(/1 из 1/);
    first.unmount();

    render(<ReviewSession />);
    expect(await screen.findByText(/1 из 1/)).toBeInTheDocument();
    expect(screen.getByText('встреча')).toBeInTheDocument();
  });

  it('counts only the words that are due for review on the folder chip', async () => {
    const folderId = (await db.folders.add({ name: 'work', color: 'blue', order: 1 })) as number;
    await db.words.add(reviewWord({ term: 'meeting', translation: 'встреча', folderId }));
    await db.words.add({ ...reviewWord({ term: 'fresh', translation: 'новое', folderId }), stage: 'new', learningPhase: 'A' });

    render(<ReviewSession />);

    await waitFor(() => expect(screen.getByRole('button', { name: /work/ })).toHaveTextContent('work1'));
  });

  it('forgets the filter when the study language changes', async () => {
    const folderId = (await db.folders.add({ name: 'work', color: 'blue', order: 1 })) as number;
    useUIStore.setState({ reviewFolderFilter: folderId, reviewTagFilter: [5] });

    useUIStore.getState().setStudyLanguage('es');
    useUIStore.getState().setStudyLanguage('en');

    expect(useUIStore.getState().reviewFolderFilter).toBe('all');
    expect(useUIStore.getState().reviewTagFilter).toEqual([]);
  });
});

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WordItem } from './WordItem';
import type { Word } from '@/db/word.type';

function baseWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 1,
    term: 'apple',
    translation: 'яблоко',
    createdAt: 0,
    kind: 'word',
    stage: 'new',
    learningPhase: 'A',
    phaseStreak: 0,
    rating: 0,
    reviewStreak: 0,
    ...overrides,
  };
}

describe('WordItem', () => {
  it('shows the "Learning" badge for a new word without a phrase tag', () => {
    render(<WordItem word={baseWord()} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Учится')).toBeInTheDocument();
    expect(screen.queryByText('Фраза')).not.toBeInTheDocument();
  });

  it('shows the "Phrase" tag next to a phrase in the New stage', () => {
    render(<WordItem word={baseWord({ term: 'as soon as possible', kind: 'phrase' })} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('Учится')).toBeInTheDocument();
    expect(screen.getByText('Фраза')).toBeInTheDocument();
  });

  it('shows a colored dot and rating number for a word in review', () => {
    render(
      <WordItem
        word={baseWord({ stage: 'review', learningPhase: 'B', rating: 85, lastReviewedAt: Date.now() })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Рейтинг')).toBeInTheDocument();
    expect(screen.queryByText('Учится')).not.toBeInTheDocument();
  });

  it('shows the "Phrase" tag and rating together for a phrase in review', () => {
    render(
      <WordItem
        word={baseWord({
          term: 'as soon as possible',
          kind: 'phrase',
          stage: 'review',
          learningPhase: 'B',
          rating: 20,
          lastReviewedAt: Date.now(),
        })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Фраза')).toBeInTheDocument();
  });

  it('calls onEdit and onDelete when the buttons are clicked', async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    render(<WordItem word={baseWord()} onEdit={onEdit} onDelete={onDelete} />);

    screen.getByRole('button', { name: 'Изменить' }).click();
    screen.getByRole('button', { name: 'Удалить' }).click();

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

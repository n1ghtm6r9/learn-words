import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { WordItem } from './WordItem';
import { speak } from '@/lib/tts';
import type { Word } from '@/db/word.type';

vi.mock('@/lib/tts', () => ({
  isSpeechSupported: () => true,
  speak: vi.fn(),
}));

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

  it('calls onEdit immediately when the edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<WordItem word={baseWord()} onEdit={onEdit} onDelete={vi.fn()} />);

    screen.getByRole('button', { name: 'Изменить' }).click();

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('requires a confirming second click before calling onDelete', () => {
    const onDelete = vi.fn();
    render(<WordItem word={baseWord()} onEdit={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Удалить это слово?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('cancels the delete confirmation without calling onDelete', () => {
    const onDelete = vi.fn();
    render(<WordItem word={baseWord()} onEdit={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Удалить это слово?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });

  it('shows a speak button that pronounces the term when clicked', () => {
    render(<WordItem word={baseWord({ term: 'apple' })} onEdit={vi.fn()} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Озвучить' }));

    expect(speak).toHaveBeenCalledWith('apple');
  });
});

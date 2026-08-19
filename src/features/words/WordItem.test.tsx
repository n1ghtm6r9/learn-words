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
  it('announces the learning step for a new word and shows no rating', () => {
    render(<WordItem word={baseWord()} onEdit={vi.fn()} onDelete={vi.fn()} onOpenDetails={vi.fn()} />);

    expect(screen.getByText('Учится, шаг 1 из 2')).toBeInTheDocument();
    expect(screen.queryByText('Рейтинг')).not.toBeInTheDocument();
    expect(screen.queryByText('Фраза')).not.toBeInTheDocument();
  });

  it('shows the "Phrase" tag next to a phrase in the New stage', () => {
    render(<WordItem word={baseWord({ term: 'as soon as possible', kind: 'phrase' })} onEdit={vi.fn()} onDelete={vi.fn()} onOpenDetails={vi.fn()} />);

    expect(screen.getByText('Учится, шаг 1 из 2')).toBeInTheDocument();
    expect(screen.getByText('Фраза')).toBeInTheDocument();
  });

  it('shows a whole-number rating for a word in review, keeping the list scannable', () => {
    render(
      <WordItem
        word={baseWord({ stage: 'review', learningPhase: 'B', rating: 85.4, lastReviewedAt: Date.now() })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('Рейтинг')).toBeInTheDocument();
    expect(screen.queryByText(/Учится/)).not.toBeInTheDocument();
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
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Фраза')).toBeInTheDocument();
  });

  it('calls onEdit immediately when the edit button is clicked', () => {
    const onEdit = vi.fn();
    render(<WordItem word={baseWord()} onEdit={onEdit} onDelete={vi.fn()} onOpenDetails={vi.fn()} />);

    screen.getByRole('button', { name: 'Изменить' }).click();

    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('requires a confirming second click before calling onDelete', () => {
    const onDelete = vi.fn();
    render(<WordItem word={baseWord()} onEdit={vi.fn()} onDelete={onDelete} onOpenDetails={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.getByText('Удалить это слово?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('cancels the delete confirmation without calling onDelete', () => {
    const onDelete = vi.fn();
    render(<WordItem word={baseWord()} onEdit={vi.fn()} onDelete={onDelete} onOpenDetails={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));
    fireEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByText('Удалить это слово?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Удалить' })).toBeInTheDocument();
  });

  it('opens the details view when the card is clicked', () => {
    const onOpenDetails = vi.fn();
    render(<WordItem word={baseWord({ term: 'apple' })} onEdit={vi.fn()} onDelete={vi.fn()} onOpenDetails={onOpenDetails} />);

    fireEvent.click(screen.getByRole('button', { name: /Открыть подробности: apple/ }));

    expect(onOpenDetails).toHaveBeenCalledOnce();
  });

  it('speaking the term does not also open the details view', () => {
    const onOpenDetails = vi.fn();
    render(<WordItem word={baseWord({ term: 'apple' })} onEdit={vi.fn()} onDelete={vi.fn()} onOpenDetails={onOpenDetails} />);

    fireEvent.click(screen.getByRole('button', { name: 'Озвучить' }));

    expect(onOpenDetails).not.toHaveBeenCalled();
  });

  it('shows a speak button that pronounces the term when clicked', () => {
    render(<WordItem word={baseWord({ term: 'apple' })} onEdit={vi.fn()} onDelete={vi.fn()} onOpenDetails={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Озвучить' }));

    expect(speak).toHaveBeenCalledWith('apple');
  });
});

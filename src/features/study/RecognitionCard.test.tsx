import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { playSound } from '@/lib/playSound';
import { RecognitionCard } from './RecognitionCard';

vi.mock('@/lib/tts', () => ({
  isSpeechSupported: () => true,
  speak: vi.fn(),
}));

vi.mock('@/lib/playSound', () => ({ playSound: vi.fn() }));

describe('RecognitionCard', () => {
  it('shows both the word and the translation at once', () => {
    render(<RecognitionCard term="hello" translation="привет" onAnswer={vi.fn()} />);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
  });

  it('a correct answer auto-advances without requiring a second click', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecognitionCard term="hello" translation="привет" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    expect(screen.queryByRole('button', { name: 'Далее' })).not.toBeInTheDocument();

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('correct', 1, 1));
  });

  it('a wrong answer requires retyping the same word before onAnswer fires', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecognitionCard term="cat" translation="кот" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(screen.getByLabelText('Слово')).toHaveValue('');

    await user.type(screen.getByLabelText('Слово'), 'cat');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('wrong', 0, expect.any(Number)));
    expect(onAnswer).toHaveBeenCalledOnce();
  });

  it('shows phase progress when a required streak is provided', () => {
    render(
      <RecognitionCard term="hello" translation="привет" currentStreak={0} requiredStreak={2} onAnswer={vi.fn()} />,
    );

    expect(screen.getByText('Прогресс: 0 из 2')).toBeInTheDocument();
  });

  it('shows the displayed progress reset to 0 immediately after a major error, before the correction is even submitted', async () => {
    const user = userEvent.setup();
    render(
      <RecognitionCard term="cat" translation="кот" currentStreak={2} requiredStreak={3} onAnswer={vi.fn()} />,
    );

    expect(screen.getByText('Прогресс: 2 из 3')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(screen.getByText('Прогресс: 0 из 3')).toBeInTheDocument();
  });

  it('does not reset the displayed progress after a minor error', async () => {
    const user = userEvent.setup();
    render(
      <RecognitionCard term="cat" translation="кот" currentStreak={2} requiredStreak={3} onAnswer={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Слово'), 'cot');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(screen.getByText('Прогресс: 2 из 3')).toBeInTheDocument();
  });

  it('puts the delete control immediately after the speak button', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<RecognitionCard term="hello" translation="привет" onAnswer={vi.fn()} onDelete={onDelete} />);

    const speak = screen.getByRole('button', { name: 'Озвучить' });
    const remove = screen.getByRole('button', { name: 'Удалить' });
    expect(remove.parentElement).toBe(speak.parentElement);
    expect(speak.compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    await user.click(remove);
    expect(onDelete).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Удалить' }));
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('offers no delete control when the card is not allowed to delete', () => {
    render(<RecognitionCard term="hello" translation="привет" onAnswer={vi.fn()} />);

    expect(screen.queryByRole('button', { name: 'Удалить' })).not.toBeInTheDocument();
  });

  it('on a near miss shows the typed word next to the correct one with the differing letters marked', async () => {
    const user = userEvent.setup();
    render(<RecognitionCard term="apple" translation="яблоко" onAnswer={vi.fn()} />);

    await user.type(screen.getByLabelText('Слово'), 'aple');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Почти! Проверьте написание ещё раз.');
    const diff = screen.getByTestId('answer-diff');
    expect(within(diff).getByText('Вы ввели')).toBeInTheDocument();
    expect(within(diff).getByText('Правильно')).toBeInTheDocument();
    const missing = diff.querySelectorAll('[data-diff="missing"]');
    expect(Array.from(missing, (mark) => mark.textContent)).toEqual(['p']);
    expect(diff.querySelectorAll('[data-diff="extra"]')).toHaveLength(0);
  });

  it('marks a wrong letter in the attempt and the missing one in the word', async () => {
    const user = userEvent.setup();
    render(<RecognitionCard term="cat" translation="кот" onAnswer={vi.fn()} />);

    await user.type(screen.getByLabelText('Слово'), 'cot');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    const diff = await screen.findByTestId('answer-diff');
    expect(diff.querySelector('[data-diff="extra"]')).toHaveTextContent('o');
    expect(diff.querySelector('[data-diff="missing"]')).toHaveTextContent('a');
  });

  it('does not show the letter comparison for a clearly wrong answer', async () => {
    const user = userEvent.setup();
    render(<RecognitionCard term="cat" translation="кот" onAnswer={vi.fn()} />);

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await screen.findByTestId('feedback');
    expect(screen.queryByTestId('answer-diff')).not.toBeInTheDocument();
  });

  it('plays a chime for a correct answer and a low tone for a mistake', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<RecognitionCard term="hello" translation="привет" onAnswer={vi.fn()} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(playSound).toHaveBeenLastCalledWith('correct');
    unmount();

    render(<RecognitionCard term="cat" translation="кот" onAnswer={vi.fn()} />);
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    expect(playSound).toHaveBeenLastCalledWith('wrong');
  });
});

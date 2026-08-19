import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecognitionCard } from './RecognitionCard';

vi.mock('@/lib/tts', () => ({
  isSpeechSupported: () => true,
  speak: vi.fn(),
}));

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

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('correct'));
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

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('wrong'));
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
});

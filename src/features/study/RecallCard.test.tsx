import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecallCard } from './RecallCard';

vi.mock('@/lib/tts', () => ({
  isSpeechSupported: () => true,
  speak: vi.fn(),
}));

describe('RecallCard', () => {
  it('shows the translation and hides the term before answering', () => {
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={vi.fn()} />);

    expect(screen.getByText('привет')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Озвучить' })).not.toBeInTheDocument();
  });

  it('a correct answer auto-advances without requiring a second click', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    expect(screen.queryByRole('button', { name: 'Далее' })).not.toBeInTheDocument();

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('correct'));
  });

  it('pressing Enter on the correct flash skips the delay', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    await user.keyboard('{Enter}');

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('correct'));
  });

  it('a wrong answer requires retyping the same word and does not call onAnswer until it is corrected', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="кот" expectedTerm="cat" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('cat');
    expect(onAnswer).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(screen.getByLabelText('Слово')).toHaveValue('');

    await user.type(screen.getByLabelText('Слово'), 'cat');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('wrong'));
  });

  it('reports the original error severity even after multiple retries', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="кот" expectedTerm="cat" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'xyz');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await user.type(screen.getByLabelText('Слово'), 'cot');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    await user.type(screen.getByLabelText('Слово'), 'cat');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('wrong'));
    expect(onAnswer).toHaveBeenCalledOnce();
  });

  it('shows a speak button once an answer has been submitted, so TTS cannot leak it beforehand', async () => {
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={vi.fn()} />);

    await user.type(screen.getByLabelText('Слово'), 'wrong-guess');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Озвучить' })).toBeInTheDocument();
  });

  it('shows phase progress when a required streak is provided', () => {
    render(
      <RecallCard translation="привет" expectedTerm="hello" currentStreak={1} requiredStreak={3} onAnswer={vi.fn()} />,
    );

    expect(screen.getByText('Прогресс: 1 из 3')).toBeInTheDocument();
  });

  it('hides phase progress when no required streak is provided', () => {
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={vi.fn()} />);

    expect(screen.queryByText(/Прогресс:/)).not.toBeInTheDocument();
  });

  it('shows the displayed progress reset to 0 immediately after a major error, before the correction is even submitted', async () => {
    const user = userEvent.setup();
    render(
      <RecallCard translation="кот" expectedTerm="cat" currentStreak={2} requiredStreak={3} onAnswer={vi.fn()} />,
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
      <RecallCard translation="кот" expectedTerm="cat" currentStreak={2} requiredStreak={3} onAnswer={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Слово'), 'cot');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');
    await user.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(screen.getByText('Прогресс: 2 из 3')).toBeInTheDocument();
  });
});

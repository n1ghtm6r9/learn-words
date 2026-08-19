import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('correct', 1, 1));
  });

  it('pressing Enter on the correct flash reports the answer before the flash delay elapses', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    expect(onAnswer).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: 'Enter' });

    expect(onAnswer).toHaveBeenCalledWith('correct', 1, 1);
  });

  it('without Enter the answer is reported only after the flash delay, not immediately', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    expect(onAnswer).not.toHaveBeenCalled();
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('correct', 1, 1));
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
    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('wrong', 0, expect.any(Number)));
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

    await waitFor(() => expect(onAnswer).toHaveBeenCalledWith('wrong', 0, expect.any(Number)));
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

  it('keeps the phase progress visible while answering, not only before submitting', async () => {
    const user = userEvent.setup();
    render(
      <RecallCard translation="кот" expectedTerm="cat" currentStreak={1} requiredStreak={3} onAnswer={vi.fn()} />,
    );

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    expect(screen.getByText('Прогресс: 0 из 3')).toBeInTheDocument();
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

  it('a held-down Enter does not advance the card', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    fireEvent.keyDown(window, { key: 'Enter', repeat: true });
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it('reports the answer only once even if Enter is pressed several times', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await screen.findByTestId('feedback');

    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'Enter' });

    await waitFor(() => expect(onAnswer).toHaveBeenCalledTimes(1));
  });

  it('an empty submission is ignored rather than recorded as a wrong answer', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(screen.queryByTestId('feedback')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Слово')).toBeInTheDocument();
    expect(onAnswer).not.toHaveBeenCalled();
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

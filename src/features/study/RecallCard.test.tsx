import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecallCard } from './RecallCard';

vi.mock('@/lib/tts', () => ({
  isSpeechSupported: () => true,
  speak: vi.fn(),
}));

describe('RecallCard', () => {
  it('shows the translation, accepts word input, and reports the verdict via the Next button', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    expect(screen.getByText('привет')).toBeInTheDocument();
    expect(screen.queryByText('hello')).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(onAnswer).toHaveBeenCalledWith('correct');
  });

  it('shows the correct word and reports a wrong verdict on an incorrect answer', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="кот" expectedTerm="cat" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('cat');

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(onAnswer).toHaveBeenCalledWith('wrong');
  });

  it('disables speech playback before answering and enables it after, so TTS cannot leak the answer', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="привет" expectedTerm="hello" onAnswer={onAnswer} />);

    expect(screen.queryByRole('button', { name: 'Озвучить' })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');
    expect(screen.getByRole('button', { name: 'Озвучить' })).toBeInTheDocument();
  });
});

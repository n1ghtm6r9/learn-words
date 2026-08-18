import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecallCard } from './RecallCard';

vi.mock('@/lib/tts', () => ({
  isSpeechSupported: () => true,
  speak: vi.fn(),
}));

describe('RecallCard', () => {
  it('показывает перевод, принимает ввод слова и сообщает вердикт по кнопке Далее', async () => {
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

  it('при неверном ответе показывает правильное слово и сообщает вердикт wrong', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecallCard translation="кот" expectedTerm="cat" onAnswer={onAnswer} />);

    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('cat');

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(onAnswer).toHaveBeenCalledWith('wrong');
  });

  it('не даёт озвучить слово до ответа и даёт после, чтобы не сливать ответ через TTS', async () => {
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

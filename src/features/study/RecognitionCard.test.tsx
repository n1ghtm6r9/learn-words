import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecognitionCard } from './RecognitionCard';

describe('RecognitionCard', () => {
  it('показывает и слово, и перевод одновременно, принимает ввод слова', async () => {
    const onAnswer = vi.fn();
    const user = userEvent.setup();
    render(<RecognitionCard term="hello" translation="привет" onAnswer={onAnswer} />);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    expect(await screen.findByTestId('feedback')).toHaveTextContent('Верно!');

    await user.click(screen.getByRole('button', { name: 'Далее' }));
    expect(onAnswer).toHaveBeenCalledWith('correct');
  });
});

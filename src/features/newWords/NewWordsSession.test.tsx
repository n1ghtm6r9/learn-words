import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWordsSession } from './NewWordsSession';
import { db } from '@/db/db';
import { createWord } from '@/db/createWord';
import { useUIStore } from '@/store/useUIStore';

describe('NewWordsSession', () => {
  beforeEach(async () => {
    await db.words.clear();
    useUIStore.setState({ phaseARepeats: 1, phaseBRepeats: 1, screen: 'newWords' });
  });

  it('показывает пустое состояние, если новых слов нет', async () => {
    render(<NewWordsSession />);
    expect(await screen.findByText('Нет новых слов — добавьте немного!')).toBeInTheDocument();
  });

  it('проводит слово через Фазу A и Фазу B (по 1 повтору) и переводит его в Повторение', async () => {
    await db.words.add(createWord('hello', 'привет'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    // Фаза A: видно и слово, и перевод
    expect(await screen.findByText('hello')).toBeInTheDocument();
    expect(screen.getByText('привет')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    // "привет" виден в обеих фазах через разные узлы — гонка с асинхронным
    // handleAnswer. "hello" виден только в Фазе A, поэтому его исчезновение —
    // однозначный сигнал, что переход в Фазу B уже произошёл.
    await waitFor(() => expect(screen.queryByText('hello')).not.toBeInTheDocument());

    // Фаза B: виден только перевод
    expect(await screen.findByText('привет')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Слово'), 'hello');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    expect(await screen.findByText('Новые слова выучены')).toBeInTheDocument();
    expect(screen.getByText(/Выучено слов: 1/)).toBeInTheDocument();

    const stored = await db.words.toArray();
    expect(stored[0].stage).toBe('review');
    expect(stored[0].rating).toBe(70);
  });

  it('ошибка в фазе сбрасывает phaseStreak, но не переводит слово дальше', async () => {
    await db.words.add(createWord('cat', 'кот'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('cat');
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    // Слово остаётся в пуле (не выучено), фаза всё ещё A
    expect(await screen.findByText('cat')).toBeInTheDocument();
    const stored = await db.words.toArray();
    expect(stored[0].learningPhase).toBe('A');
    expect(stored[0].phaseStreak).toBe(0);
  });

  it('после неверного ответа карточка сбрасывается и снова показывает поле ввода', async () => {
    await db.words.add(createWord('cat', 'кот'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('cat');
    await user.type(screen.getByLabelText('Слово'), 'dog');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    expect(await screen.findByLabelText('Слово')).toHaveValue('');
  });

  it('чередует слова из пула — одно и то же слово не встречается два раза подряд', async () => {
    await db.words.add(createWord('one', 'один'));
    await db.words.add(createWord('two', 'два'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    const seenTerms: string[] = [];
    for (let i = 0; i < 4; i++) {
      const termNode = await screen.findByText(/^(one|two)$/);
      seenTerms.push(termNode.textContent ?? '');
      await user.type(screen.getByLabelText('Слово'), 'wrong');
      await user.click(screen.getByRole('button', { name: 'Проверить' }));
      await user.click(await screen.findByRole('button', { name: 'Далее' }));
    }

    for (let i = 1; i < seenTerms.length; i++) {
      expect(seenTerms[i]).not.toBe(seenTerms[i - 1]);
    }
  });

  it('двойной клик "Далее" на выпускном ответе не удваивает счётчик выученных слов', async () => {
    await db.words.add(createWord('sun', 'солнце'));
    const user = userEvent.setup();
    render(<NewWordsSession />);

    await screen.findByText('sun');
    await user.type(screen.getByLabelText('Слово'), 'sun');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));
    await user.click(await screen.findByRole('button', { name: 'Далее' }));

    await screen.findByText('солнце');
    await user.type(screen.getByLabelText('Слово'), 'sun');
    await user.click(screen.getByRole('button', { name: 'Проверить' }));

    const nextButton = await screen.findByRole('button', { name: 'Далее' });
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    expect(await screen.findByText('Новые слова выучены')).toBeInTheDocument();
    expect(screen.getByText(/Выучено слов: 1/)).toBeInTheDocument();
  });
});

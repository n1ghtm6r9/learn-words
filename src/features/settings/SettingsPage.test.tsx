import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { useUIStore } from '@/store/useUIStore';

describe('SettingsPage', () => {
  beforeEach(() => {
    useUIStore.setState({ phaseARepeats: 3, phaseBRepeats: 3, theme: 'light', accentColor: 'blue' });
  });

  it('показывает текущие значения и обновляет их через сторy', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    expect(phaseAInput).toHaveValue(3);

    await user.clear(phaseAInput);
    await user.type(phaseAInput, '5');

    expect(useUIStore.getState().phaseARepeats).toBe(5);
  });

  it('переключает тему через кнопки', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Тёмная' }));
    expect(useUIStore.getState().theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Светлая' }));
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('меняет цвет акцента и отмечает выбранный вариант', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByRole('button', { name: 'Синий' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Фиолетовый' }));

    expect(useUIStore.getState().accentColor).toBe('purple');
    expect(screen.getByRole('button', { name: 'Фиолетовый' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Синий' })).toHaveAttribute('aria-pressed', 'false');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { useUIStore } from '@/store/useUIStore';

describe('SettingsPage', () => {
  beforeEach(() => {
    useUIStore.setState({ phaseARepeats: 3, phaseBRepeats: 3, theme: 'light', accentColor: 'blue', language: 'ru' });
  });

  it('shows current values and updates them through the store', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    expect(phaseAInput).toHaveValue(3);

    await user.clear(phaseAInput);
    await user.type(phaseAInput, '5');

    expect(useUIStore.getState().phaseARepeats).toBe(5);
  });

  it('switches the theme using the buttons', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    await user.click(screen.getByRole('button', { name: 'Тёмная' }));
    expect(useUIStore.getState().theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Светлая' }));
    expect(useUIStore.getState().theme).toBe('light');
  });

  it('changes the accent color and marks the selected option', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByRole('button', { name: 'Синий' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Фиолетовый' }));

    expect(useUIStore.getState().accentColor).toBe('purple');
    expect(screen.getByRole('button', { name: 'Фиолетовый' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Синий' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switches the interface language and re-renders labels', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    expect(screen.getByText('Тема')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'English' }));

    expect(useUIStore.getState().language).toBe('en');
    expect(screen.getByText('Theme')).toBeInTheDocument();
    expect(screen.getByLabelText(/Repeats in the recognition phase/)).toBeInTheDocument();
  });
});

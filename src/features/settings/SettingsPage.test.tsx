import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { useUIStore } from '@/store/useUIStore';

describe('SettingsPage', () => {
  beforeEach(() => {
    useUIStore.setState({ phaseARepeats: 3, phaseBRepeats: 3, theme: 'light', accentColor: 'blue', language: 'ru' });
  });

  it('shows current values and commits them to the store once editing finishes', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    expect(phaseAInput).toHaveValue(3);

    await user.clear(phaseAInput);
    await user.type(phaseAInput, '5');
    await user.tab();

    expect(useUIStore.getState().phaseARepeats).toBe(5);
  });

  it('does not commit half-typed intermediate values while the user is still typing', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    await user.clear(phaseAInput);
    await user.type(phaseAInput, '12');

    expect(useUIStore.getState().phaseARepeats).toBe(3);
  });

  it('commits the pending value when the settings view closes without a blur', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    await user.clear(phaseAInput);
    await user.type(phaseAInput, '12');

    unmount();

    expect(useUIStore.getState().phaseARepeats).toBe(10);
  });

  it('clamps an out-of-range value on blur and keeps the displayed text in sync with the store', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    await user.clear(phaseAInput);
    await user.type(phaseAInput, '12');
    expect(phaseAInput).toHaveValue(12);

    await user.tab();

    expect(phaseAInput).toHaveValue(10);
    expect(useUIStore.getState().phaseARepeats).toBe(10);
  });

  it('falls back to the last valid value on blur when the field is left empty', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const phaseAInput = screen.getByLabelText(/Повторов в фазе узнавания/);
    await user.clear(phaseAInput);
    await user.tab();

    expect(phaseAInput).toHaveValue(3);
    expect(useUIStore.getState().phaseARepeats).toBe(3);
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

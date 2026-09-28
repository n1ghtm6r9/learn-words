import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from './SettingsPage';
import { getCloud } from '@/cloud/getCloud';
import type { CloudApi } from '@/cloud/cloudApi.type';
import { createFakeCloud } from '@/cloud/testing/createFakeCloud';
import { useUIStore } from '@/store/useUIStore';

vi.mock('@/cloud/getCloud', () => ({ getCloud: vi.fn(() => null) }));

function provideFakeCloud(...args: Parameters<typeof createFakeCloud>) {
  const cloud = createFakeCloud(...args);
  vi.mocked(getCloud).mockReturnValue(cloud as unknown as CloudApi);
  return cloud;
}

describe('AccountSection', () => {
  beforeEach(() => {
    vi.mocked(getCloud).mockReturnValue(null);
    useUIStore.setState({ language: 'ru', settingsOpen: true });
  });

  it('stays hidden when no cloud database is configured', () => {
    render(<SettingsPage />);

    expect(screen.queryByText('Аккаунт')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Войти' })).not.toBeInTheDocument();
  });

  it('offers a guest to sign in and starts the login flow from a closed settings view', async () => {
    const cloud = provideFakeCloud({ isLoggedIn: false });
    render(<SettingsPage />);

    expect(screen.getByText('Гостевой режим — слова хранятся только на этом устройстве')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(cloud.login).toHaveBeenCalledTimes(1);
    expect(cloud.login).toHaveBeenCalledWith({ provider: 'google', intent: 'login' });
    expect(useUIStore.getState().settingsOpen).toBe(false);
  });

  it('shows that the user is signed in without revealing the email, with its sync status, and signs out', async () => {
    const cloud = provideFakeCloud({ isLoggedIn: true, email: 'anna@example.com' }, { phase: 'in-sync' });
    render(<SettingsPage />);

    expect(screen.getByText('Вы вошли в аккаунт')).toBeInTheDocument();
    expect(screen.queryByText(/anna@example\.com/)).not.toBeInTheDocument();
    expect(screen.getByText('Синхронизировано')).toBeInTheDocument();
    expect(
      screen.getByText('После выхода слова удалятся с этого устройства, но останутся в аккаунте'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }));

    expect(cloud.logout).toHaveBeenCalledTimes(1);
  });

  it('follows the sync phase as it changes', () => {
    const cloud = provideFakeCloud({ isLoggedIn: true, email: 'anna@example.com' }, { phase: 'pushing' });
    render(<SettingsPage />);

    expect(screen.getByText('Синхронизация…')).toBeInTheDocument();

    act(() => cloud.syncState.next({ status: 'offline', phase: 'offline' }));
    expect(screen.getByText('Нет сети')).toBeInTheDocument();

    act(() => cloud.syncState.next({ status: 'error', phase: 'error' }));
    expect(screen.getByText('Ошибка синхронизации')).toBeInTheDocument();
  });

  it('tells how many trial days of sync are left', () => {
    provideFakeCloud({
      isLoggedIn: true,
      email: 'anna@example.com',
      license: { type: 'eval', status: 'ok', evalDaysLeft: 12 },
    });
    render(<SettingsPage />);

    expect(screen.getByText('Пробный доступ: синхронизация ещё 12 дн.')).toBeInTheDocument();
  });

  it('asks to contact the owner once the access has expired', () => {
    provideFakeCloud({
      isLoggedIn: true,
      email: 'anna@example.com',
      license: { type: 'eval', status: 'expired', evalDaysLeft: 0 },
    });
    render(<SettingsPage />);

    expect(screen.getByText('Синхронизация отключена — попросите доступ у владельца')).toBeInTheDocument();
    expect(screen.queryByText(/Пробный доступ/)).not.toBeInTheDocument();
  });
});

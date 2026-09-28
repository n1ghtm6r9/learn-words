import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { DXCAlert, DXCUserInteraction } from 'dexie-cloud-addon';
import { LoginDialog } from './LoginDialog';
import type { CloudApi } from '@/cloud/cloudApi.type';
import { runCloudFlow } from '@/cloud/runCloudFlow';
import { useCloudFlowStore } from '@/cloud/useCloudFlowStore';
import { createFakeCloud } from '@/cloud/testing/createFakeCloud';
import { useUIStore } from '@/store/useUIStore';

vi.mock('@/cloud/allowedEmailHashes', () => ({
  ALLOWED_EMAIL_HASHES: ['f7d54c22dda5b1780276601cd005909b70543fc4a6ba72d735b4cb9bbb611f01'],
}));

type Cloud = ReturnType<typeof createFakeCloud>;

function prompt(cloud: Cloud, type: DXCUserInteraction['type'], alerts: DXCAlert[] = []) {
  const interaction = {
    type,
    title: 'Dexie title',
    alerts,
    fields: {},
    submitLabel: 'Dexie submit',
    cancelLabel: 'Dexie cancel',
    onSubmit: vi.fn(() => cloud.userInteraction.next(undefined)),
    onCancel: vi.fn(() => cloud.userInteraction.next(undefined)),
  };
  act(() => cloud.userInteraction.next(interaction as unknown as DXCUserInteraction));
  return interaction;
}

function renderDialog(cloud: Cloud) {
  render(<LoginDialog cloud={cloud as unknown as CloudApi} />);
}

describe('LoginDialog', () => {
  beforeEach(() => {
    useUIStore.setState({ language: 'ru' });
    useCloudFlowStore.setState({ running: false, awaiting: undefined, denied: false });
  });

  it('stays closed while the cloud asks for nothing', () => {
    renderDialog(createFakeCloud());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps an email that was not invited from reaching the server', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    const email = prompt(cloud, 'email');

    expect(screen.getByText('Вход в аккаунт')).toBeInTheDocument();
    expect(screen.queryByText('Dexie title')).not.toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Почта'), 'stranger@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Получить код' }));

    expect(await screen.findByText('Вход только по приглашению')).toBeInTheDocument();
    expect(email.onSubmit).not.toHaveBeenCalled();
  });

  it('submits an invited email in its normalized form', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    const email = prompt(cloud, 'email');

    await userEvent.type(screen.getByLabelText('Почта'), 'Anna@Example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Получить код' }));

    await waitFor(() => expect(email.onSubmit).toHaveBeenCalledWith({ email: 'anna@example.com' }));
    expect(screen.queryByText('Вход только по приглашению')).not.toBeInTheDocument();
  });

  it('asks for the code sent to the email and submits it', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    const otp = prompt(cloud, 'otp', [
      { type: 'info', messageCode: 'OTP_SENT', message: 'A One-Time password has been sent to {email}', messageParams: { email: 'anna@example.com' } },
    ]);

    expect(screen.getByText('Код отправлен на почту')).toBeInTheDocument();
    expect(screen.queryByText(/anna@example\.com/)).not.toBeInTheDocument();
    const input = screen.getByLabelText('Код');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');

    await userEvent.type(input, ' 12345678 ');
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }));

    expect(otp.onSubmit).toHaveBeenCalledWith({ otp: '12345678' });
  });

  it('translates a known alert code instead of showing the server text', () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    prompt(cloud, 'message-alert', [
      { type: 'error', messageCode: 'NO_SEATS_AVAILABLE', message: 'No seats left', messageParams: {} },
    ]);

    expect(screen.getByText('Не удалось войти')).toBeInTheDocument();
    expect(screen.getByText('Свободных мест нет. Попросите владельца добавить вас.')).toBeInTheDocument();
    expect(screen.queryByText('No seats left')).not.toBeInTheDocument();
  });

  it('falls back to the server text for an unknown alert code', () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    prompt(cloud, 'message-alert', [
      { type: 'error', messageCode: 'GENERIC_ERROR', message: 'Server is down for {minutes} minutes', messageParams: { minutes: '5' } },
    ]);

    expect(screen.getByText('Server is down for 5 minutes')).toBeInTheDocument();
  });

  it('acknowledges a message when it is closed', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    const alert = prompt(cloud, 'message-alert', [
      { type: 'error', messageCode: 'USER_DEACTIVATED', message: 'Deactivated', messageParams: {} },
    ]);

    await userEvent.click(screen.getByRole('button', { name: 'Закрыть' }));

    expect(alert.onSubmit).toHaveBeenCalledWith({});
    expect(alert.onCancel).not.toHaveBeenCalled();
  });

  it('cancels the sign-in when the dialog is closed', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    const email = prompt(cloud, 'email');

    await userEvent.click(screen.getByRole('button', { name: 'Отмена' }));

    expect(email.onCancel).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('warns that unsynced changes are lost before signing out', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    const confirmation = prompt(cloud, 'logout-confirmation', [
      { type: 'warning', messageCode: 'LOGOUT_CONFIRMATION', message: 'Unsynced', messageParams: { numUnsyncedChanges: '3' } },
    ]);

    expect(screen.getByText('Выйти из аккаунта?')).toBeInTheDocument();
    expect(
      screen.getByText('Не синхронизировано изменений: 3. Если выйти сейчас, они пропадут с этого устройства.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Всё равно выйти' }));

    expect(confirmation.onSubmit).toHaveBeenCalledWith({});
  });

  it('stays on the submitted step until the cloud answers with the next one', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    let finish: () => void = () => {};
    let flow: Promise<void> = Promise.resolve();
    act(() => {
      flow = runCloudFlow(() => new Promise<void>((resolve) => (finish = resolve)));
    });
    prompt(cloud, 'email');

    await userEvent.type(screen.getByLabelText('Почта'), 'anna@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Получить код' }));

    await waitFor(() => expect(cloud.userInteraction.getValue()).toBeUndefined());
    expect(screen.getByRole('button', { name: 'Получить код' })).toBeDisabled();

    prompt(cloud, 'otp');
    expect(screen.getByLabelText('Код')).toBeInTheDocument();

    await act(async () => {
      finish();
      await flow;
    });
    act(() => cloud.userInteraction.next(undefined));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('offers the configured sign-in methods and submits the chosen provider', async () => {
    const cloud = createFakeCloud();
    renderDialog(cloud);
    const choice = {
      type: 'generic',
      title: 'Choose login method',
      alerts: [],
      fields: {},
      options: [
        { name: 'provider', value: 'google', displayName: 'Continue with Google', styleHint: 'google' },
        { name: 'otp', value: 'email', displayName: 'Continue with email', styleHint: 'otp' },
      ],
      submitLabel: '',
      cancelLabel: 'Cancel',
      onSubmit: vi.fn(() => cloud.userInteraction.next(undefined)),
      onCancel: vi.fn(() => cloud.userInteraction.next(undefined)),
    };
    act(() => cloud.userInteraction.next(choice as unknown as DXCUserInteraction));

    expect(screen.getByRole('button', { name: 'Войти по коду из письма' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Войти через Google' }));

    expect(choice.onSubmit).toHaveBeenCalledWith({ provider: 'google' });
  });

  it('explains that an account outside the invitation list was signed out', async () => {
    renderDialog(createFakeCloud());
    act(() => useCloudFlowStore.setState({ denied: true }));

    expect(screen.getByText('Этого аккаунта нет в списке приглашённых, поэтому вход отменён.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Понятно' }));

    expect(useCloudFlowStore.getState().denied).toBe(false);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

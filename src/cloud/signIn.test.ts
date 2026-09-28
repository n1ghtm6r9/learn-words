import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudApi } from './cloudApi.type';
import { signIn } from './signIn';
import { createFakeCloud } from './testing/createFakeCloud';

const signInEmail = vi.hoisted(() => ({ SIGN_IN_EMAIL: undefined as string | undefined }));

vi.mock('./signInEmail', () => signInEmail);

describe('signIn', () => {
  beforeEach(() => {
    signInEmail.SIGN_IN_EMAIL = undefined;
  });

  it('goes straight to Google once the database offers it', async () => {
    const cloud = createFakeCloud();

    await signIn(cloud as unknown as CloudApi);

    expect(cloud.login).toHaveBeenCalledWith({ provider: 'google', intent: 'login' });
  });

  it('falls back to an emailed code for registered users while Google is not set up', async () => {
    const cloud = createFakeCloud();
    cloud.getAuthProviders = vi.fn(() => Promise.resolve({ providers: [], otpEnabled: true }));

    await signIn(cloud as unknown as CloudApi);

    expect(cloud.login).toHaveBeenCalledWith({ intent: 'login' });
  });

  it('still signs in when the provider list cannot be fetched', async () => {
    const cloud = createFakeCloud();
    cloud.getAuthProviders = vi.fn(() => Promise.reject(new Error('offline')));

    await signIn(cloud as unknown as CloudApi);

    expect(cloud.login).toHaveBeenCalledWith({ intent: 'login' });
  });

  it('sends the code straight to the configured email without asking for it', async () => {
    signInEmail.SIGN_IN_EMAIL = 'me@example.com';
    const cloud = createFakeCloud();
    cloud.getAuthProviders = vi.fn(() => Promise.resolve({ providers: [], otpEnabled: true }));

    await signIn(cloud as unknown as CloudApi);

    expect(cloud.login).toHaveBeenCalledWith({ email: 'me@example.com', grant_type: 'otp', intent: 'login' });
  });
});

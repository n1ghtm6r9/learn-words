import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CloudApi } from './cloudApi.type';
import { enforceAccess } from './enforceAccess';
import { createFakeCloud } from './testing/createFakeCloud';
import { useCloudFlowStore } from './useCloudFlowStore';

vi.mock('./allowedEmailHashes', () => ({
  ALLOWED_EMAIL_HASHES: ['8c2a47d3bdb8d3096a6479f53eac3b724291db5f1c31611100f675be5537329d'],
}));

function signedIn(email: string | undefined) {
  const cloud = createFakeCloud({ isLoggedIn: true, email });
  return { cloud, user: cloud.currentUser.getValue() };
}

describe('enforceAccess', () => {
  beforeEach(() => {
    useCloudFlowStore.setState({ running: false, awaiting: undefined, denied: false });
  });

  it('signs out an account that is not on the invitation list', async () => {
    const { cloud, user } = signedIn('stranger@example.com');

    await enforceAccess(cloud as unknown as CloudApi, user);

    expect(cloud.logout).toHaveBeenCalledTimes(1);
    expect(useCloudFlowStore.getState().denied).toBe(true);
  });

  it('treats an account without an email as not invited', async () => {
    const { cloud, user } = signedIn(undefined);

    await enforceAccess(cloud as unknown as CloudApi, user);

    expect(cloud.logout).toHaveBeenCalledTimes(1);
  });

  it('keeps an invited account signed in whatever the letter case', async () => {
    const { cloud, user } = signedIn('Me@Example.com');

    await enforceAccess(cloud as unknown as CloudApi, user);

    expect(cloud.logout).not.toHaveBeenCalled();
    expect(useCloudFlowStore.getState().denied).toBe(false);
  });

  it('ignores a guest', async () => {
    const cloud = createFakeCloud({ isLoggedIn: false });

    await enforceAccess(cloud as unknown as CloudApi, cloud.currentUser.getValue());

    expect(cloud.logout).not.toHaveBeenCalled();
  });

  it('signs out only once while the denial is still shown', async () => {
    const { cloud, user } = signedIn('stranger@example.com');

    await enforceAccess(cloud as unknown as CloudApi, user);
    await enforceAccess(cloud as unknown as CloudApi, user);

    expect(cloud.logout).toHaveBeenCalledTimes(1);
  });
});

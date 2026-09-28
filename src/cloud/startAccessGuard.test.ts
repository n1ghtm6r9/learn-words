import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeCloud } from './testing/createFakeCloud';
import { startAccessGuard } from './startAccessGuard';
import { useCloudFlowStore } from './useCloudFlowStore';

const cloud = vi.hoisted(() => ({ current: null as ReturnType<typeof createFakeCloud> | null }));

vi.mock('./getCloud', () => ({ getCloud: () => cloud.current }));
vi.mock('./allowedEmailHashes', () => ({
  ALLOWED_EMAIL_HASHES: ['8c2a47d3bdb8d3096a6479f53eac3b724291db5f1c31611100f675be5537329d'],
}));

describe('startAccessGuard', () => {
  beforeEach(() => {
    useCloudFlowStore.setState({ running: false, awaiting: undefined, denied: false });
  });

  it('checks every account the cloud signs in', async () => {
    cloud.current = createFakeCloud({ isLoggedIn: false });
    startAccessGuard();

    cloud.current.currentUser.next({ ...cloud.current.currentUser.getValue(), isLoggedIn: true, email: 'stranger@example.com' });

    await vi.waitFor(() => expect(cloud.current?.logout).toHaveBeenCalledTimes(1));
  });

  it('does nothing without a cloud', () => {
    cloud.current = null;

    expect(() => startAccessGuard()).not.toThrow();
  });
});

import { describe, expect, it, vi } from 'vitest';
import { createFakeCloud } from '@/cloud/testing/createFakeCloud';
import { pullCloudOnActivation } from './pullCloudOnActivation';
import { createFakeWebApp } from './testing/createFakeWebApp';

const cloud = vi.hoisted(() => ({ current: null as ReturnType<typeof createSyncingCloud> | null }));

vi.mock('@/cloud/getCloud', () => ({ getCloud: () => cloud.current }));

function createSyncingCloud(isLoggedIn: boolean) {
  return { ...createFakeCloud({ isLoggedIn }), sync: vi.fn(() => Promise.resolve()) };
}

describe('pullCloudOnActivation', () => {
  it('pulls the account data when the mini app comes back to the front', () => {
    cloud.current = createSyncingCloud(true);
    const { fake, webApp } = createFakeWebApp();

    pullCloudOnActivation(webApp);
    fake.emit('activated');

    expect(cloud.current.sync).toHaveBeenCalledWith({ wait: false, purpose: 'pull' });
  });

  it('leaves a guest alone', () => {
    cloud.current = createSyncingCloud(false);
    const { fake, webApp } = createFakeWebApp();

    pullCloudOnActivation(webApp);
    fake.emit('activated');

    expect(cloud.current.sync).not.toHaveBeenCalled();
  });

  it('does nothing without a cloud', () => {
    cloud.current = null;
    const { webApp } = createFakeWebApp();

    pullCloudOnActivation(webApp);

    expect(webApp.onEvent).not.toHaveBeenCalled();
  });
});

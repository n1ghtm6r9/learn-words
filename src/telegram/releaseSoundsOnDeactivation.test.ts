import { describe, expect, it, vi } from 'vitest';
import { releaseSoundsOnDeactivation } from './releaseSoundsOnDeactivation';
import { createFakeWebApp } from './testing/createFakeWebApp';

const releaseAudioContext = vi.hoisted(() => vi.fn());

vi.mock('@/lib/releaseAudioContext', () => ({ releaseAudioContext }));

describe('releaseSoundsOnDeactivation', () => {
  it('lets go of the audio when the mini app is minimized', () => {
    const { fake, webApp } = createFakeWebApp();

    releaseSoundsOnDeactivation(webApp);
    expect(releaseAudioContext).not.toHaveBeenCalled();

    fake.emit('deactivated');

    expect(releaseAudioContext).toHaveBeenCalledOnce();
  });
});

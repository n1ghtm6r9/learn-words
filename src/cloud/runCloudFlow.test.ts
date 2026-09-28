import { beforeEach, describe, expect, it } from 'vitest';
import type { DXCUserInteraction } from 'dexie-cloud-addon';
import { holdInteraction } from './holdInteraction';
import { releaseInteraction } from './releaseInteraction';
import { runCloudFlow } from './runCloudFlow';
import { useCloudFlowStore } from './useCloudFlowStore';

const prompt = { type: 'message-alert', title: '', alerts: [], fields: {}, submitLabel: '' } as unknown as DXCUserInteraction;

describe('runCloudFlow', () => {
  beforeEach(() => {
    useCloudFlowStore.setState({ running: false, awaiting: undefined });
  });

  it('marks the flow as running until it settles, even when it fails', async () => {
    let fail: (reason: Error) => void = () => {};
    const flow = runCloudFlow(() => new Promise<void>((_, reject) => (fail = reject)));

    expect(useCloudFlowStore.getState().running).toBe(true);

    fail(new Error('User cancelled'));
    await flow;

    expect(useCloudFlowStore.getState().running).toBe(false);
  });

  it('holds a submitted interaction only while a flow runs and drops it when the flow ends', async () => {
    holdInteraction(prompt);
    expect(useCloudFlowStore.getState().awaiting).toBeUndefined();

    let finish: () => void = () => {};
    const flow = runCloudFlow(() => new Promise<void>((resolve) => (finish = resolve)));

    holdInteraction(prompt);
    expect(useCloudFlowStore.getState().awaiting).toBe(prompt);

    releaseInteraction();
    expect(useCloudFlowStore.getState().awaiting).toBeUndefined();

    holdInteraction(prompt);
    finish();
    await flow;

    expect(useCloudFlowStore.getState().awaiting).toBeUndefined();
  });
});

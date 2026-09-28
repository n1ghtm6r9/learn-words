import { describe, expect, it } from 'vitest';
import { createCoalescedRunner } from './createCoalescedRunner';

describe('createCoalescedRunner', () => {
  it('runs once more after triggers that arrive mid-run instead of once per trigger', async () => {
    let calls = 0;
    let release: () => void = () => {};
    const trigger = createCoalescedRunner(async () => {
      calls += 1;
      if (calls === 1) await new Promise<void>((resolve) => (release = resolve));
    });

    trigger();
    trigger();
    trigger();
    release();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls).toBe(2);
  });

  it('keeps going after a failing run', async () => {
    let calls = 0;
    const trigger = createCoalescedRunner(async () => {
      calls += 1;
      throw new Error('boom');
    });

    trigger();
    await new Promise((resolve) => setTimeout(resolve, 0));
    trigger();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(calls).toBe(2);
  });
});

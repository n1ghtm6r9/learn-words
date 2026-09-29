import type { DragSample } from './dragSample.type';

const WINDOW_MS = 100;

export function releaseVelocity(samples: readonly DragSample[], releasedAt: number): number {
  const last = samples.at(-1);
  if (!last || releasedAt - last.time > WINDOW_MS) return 0;
  const first = samples.find((sample) => last.time - sample.time <= WINDOW_MS) ?? last;
  const elapsed = last.time - first.time;
  if (elapsed <= 0) return 0;
  return (last.y - first.y) / elapsed;
}

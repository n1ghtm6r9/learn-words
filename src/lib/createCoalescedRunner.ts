export function createCoalescedRunner(task: () => Promise<void>): () => void {
  let running = false;
  let pending = false;

  async function drain() {
    running = true;
    while (pending) {
      pending = false;
      try {
        await task();
      } catch {}
    }
    running = false;
  }

  return () => {
    pending = true;
    if (!running) void drain();
  };
}

export async function requestPersistentStorage(): Promise<void> {
  try {
    if (await navigator.storage?.persisted?.()) return;
    await navigator.storage?.persist?.();
  } catch {}
}

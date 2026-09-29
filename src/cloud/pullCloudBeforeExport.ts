import { getCloud } from './getCloud';

const PULL_TIMEOUT_MS = 4000;

export async function pullCloudBeforeExport(): Promise<void> {
  const cloud = getCloud();
  if (!cloud || !cloud.currentUser.getValue().isLoggedIn) return;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, PULL_TIMEOUT_MS);
  });
  try {
    await Promise.race([cloud.sync({ wait: true, purpose: 'pull' }), timeout]);
  } catch {
    return;
  } finally {
    clearTimeout(timer);
  }
}

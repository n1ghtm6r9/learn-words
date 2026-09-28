import type { UserLogin } from 'dexie-cloud-addon';
import type { CloudApi } from './cloudApi.type';
import { isEmailAllowed } from './isEmailAllowed';
import { markAccessDenied } from './markAccessDenied';
import { useCloudFlowStore } from './useCloudFlowStore';

export async function enforceAccess(cloud: CloudApi, user: UserLogin): Promise<void> {
  if (!user.isLoggedIn) return;
  if (await isEmailAllowed(user.email ?? '')) return;
  if (useCloudFlowStore.getState().denied) return;
  markAccessDenied();
  await cloud.logout().catch(() => undefined);
}

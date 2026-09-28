import { enforceAccess } from './enforceAccess';
import { getCloud } from './getCloud';

export function startAccessGuard(): void {
  const cloud = getCloud();
  if (!cloud) return;

  cloud.currentUser.subscribe((user) => void enforceAccess(cloud, user));
}

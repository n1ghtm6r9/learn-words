import { useCloudFlowStore } from './useCloudFlowStore';

export function markAccessDenied(): void {
  useCloudFlowStore.setState({ denied: true });
}

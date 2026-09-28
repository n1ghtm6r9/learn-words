import { useCloudFlowStore } from './useCloudFlowStore';

export function clearAccessDenied(): void {
  useCloudFlowStore.setState({ denied: false });
}

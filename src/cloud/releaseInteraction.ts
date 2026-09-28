import { useCloudFlowStore } from './useCloudFlowStore';

export function releaseInteraction(): void {
  useCloudFlowStore.setState({ awaiting: undefined });
}

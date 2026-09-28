import { useCloudFlowStore } from './useCloudFlowStore';

export async function runCloudFlow(flow: () => Promise<void>): Promise<void> {
  useCloudFlowStore.setState({ running: true, awaiting: undefined });
  await flow().catch(() => undefined);
  useCloudFlowStore.setState({ running: false, awaiting: undefined });
}

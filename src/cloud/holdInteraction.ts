import type { DXCUserInteraction } from 'dexie-cloud-addon';
import { useCloudFlowStore } from './useCloudFlowStore';

export function holdInteraction(interaction: DXCUserInteraction): void {
  useCloudFlowStore.setState((state) => (state.running ? { awaiting: interaction } : state));
}

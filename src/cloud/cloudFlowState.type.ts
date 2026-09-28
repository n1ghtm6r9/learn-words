import type { DXCUserInteraction } from 'dexie-cloud-addon';

export interface CloudFlowState {
  running: boolean;
  awaiting?: DXCUserInteraction;
  denied?: boolean;
}

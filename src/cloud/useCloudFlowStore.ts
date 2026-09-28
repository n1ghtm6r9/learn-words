import { create } from 'zustand';
import type { CloudFlowState } from './cloudFlowState.type';

export const useCloudFlowStore = create<CloudFlowState>()(() => ({ running: false }));

import type { DXCAlert } from 'dexie-cloud-addon';

export interface StepProps {
  alerts: DXCAlert[];
  pending: boolean;
  onSubmit: (params: Record<string, string>) => void;
  onCancel: () => void;
}

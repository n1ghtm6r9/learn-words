import type { Folder } from '@/db/folder.type';
import type { CloudFields } from './cloudFields.type';
import type { ExportedLabel } from './exportedLabel.type';

export function exportLabels(labels: Folder[]): ExportedLabel[] {
  return [...labels]
    .sort((a, b) => a.order - b.order)
    .map(({ id: _id, owner: _owner, realmId: _realmId, ...rest }: Folder & CloudFields) => rest);
}

import type { Folder } from '../folder.type';

export interface LegacyFolder extends Omit<Folder, 'id'> {
  id?: number;
}

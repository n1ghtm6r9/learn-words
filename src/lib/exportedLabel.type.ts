import type { Folder } from '@/db/folder.type';

export type ExportedLabel = Omit<Folder, 'id'>;

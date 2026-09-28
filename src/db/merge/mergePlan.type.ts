import type { WordTag } from '../wordTag.type';

export interface MergePlan {
  deletedWordIds: string[];
  deletedFolderIds: string[];
  deletedTagIds: string[];
  deletedLinkIds: string[];
  movedWords: Array<{ key: string; changes: { folderId: string } }>;
  relinked: WordTag[];
}

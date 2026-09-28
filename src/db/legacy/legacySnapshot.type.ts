import type { LegacyFolder } from './legacyFolder.type';
import type { LegacyTag } from './legacyTag.type';
import type { LegacyWord } from './legacyWord.type';
import type { LegacyWordTag } from './legacyWordTag.type';

export interface LegacySnapshot {
  words: LegacyWord[];
  folders: LegacyFolder[];
  tags: LegacyTag[];
  wordTags: LegacyWordTag[];
}

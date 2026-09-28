import type { Folder } from '@/db/folder.type';
import type { Tag } from '@/db/tag.type';
import type { Word } from '@/db/word.type';
import type { WordTag } from '@/db/wordTag.type';
import type { CloudFields } from './cloudFields.type';
import { exportLabels } from './exportLabels';
import type { ExportedWord } from './exportedWord.type';
import type { ExportPayload } from './exportPayload.type';
import { tagsByWord } from './tagsByWord';

interface ExportSource {
  words?: Word[];
  folders?: Folder[];
  tags?: Tag[];
  links?: WordTag[];
  settings?: ExportPayload['settings'];
}

function exportWords(words: Word[], folders: Folder[], tags: Tag[], links: WordTag[]): ExportedWord[] {
  const folderNames = new Map(folders.map((folder) => [folder.id, folder.name]));
  const tagNames = new Map(tags.map((tag) => [tag.id, tag.name]));
  const tagIdsByWord = tagsByWord(links);

  return words.map(({ id, folderId, owner: _owner, realmId: _realmId, ...rest }: Word & CloudFields) => {
    const word: ExportedWord = rest;
    const folder = folderId == null ? undefined : folderNames.get(folderId);
    if (folder) word.folder = folder;
    const wordTags = (tagIdsByWord.get(id ?? '') ?? []).flatMap((tagId) => tagNames.get(tagId) ?? []);
    if (wordTags.length > 0) word.tags = [...new Set(wordTags)];
    return word;
  });
}

export function buildExportPayload({ words, folders = [], tags = [], links = [], settings }: ExportSource): ExportPayload {
  const payload: ExportPayload = {
    version: 4,
    exportedAt: Date.now(),
  };

  if (words) {
    payload.words = exportWords(words, folders, tags, links);
    payload.folders = exportLabels(folders);
    payload.tags = exportLabels(tags);
  }

  if (settings) {
    payload.settings = settings;
  }

  return payload;
}

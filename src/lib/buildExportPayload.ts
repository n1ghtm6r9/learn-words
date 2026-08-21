import type { Word } from '@/db/word.type';
import type { ExportPayload } from './exportPayload.type';

export function buildExportPayload(options: { words?: Word[]; settings?: ExportPayload['settings'] }): ExportPayload {
  const payload: ExportPayload = {
    version: 2,
    exportedAt: Date.now(),
  };

  if (options.words) {
    payload.words = options.words.map(({ id: _id, ...rest }) => rest);
  }

  if (options.settings) {
    payload.settings = options.settings;
  }

  return payload;
}

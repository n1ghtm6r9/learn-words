import type { Word } from '@/db/word.type';
import type { ExportPayload } from './exportPayload.type';

export interface ParsedImportPayload {
  valid: boolean;
  words: Array<Pick<Word, 'term' | 'translation'> & Partial<Word>>;
  settings: Partial<NonNullable<ExportPayload['settings']>> | null;
}

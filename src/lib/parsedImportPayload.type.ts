import type { ExportPayload } from './exportPayload.type';
import type { ImportedWord } from './importedWord.type';

export interface ParsedImportPayload {
  valid: boolean;
  words: ImportedWord[];
  settings: Partial<NonNullable<ExportPayload['settings']>> | null;
}

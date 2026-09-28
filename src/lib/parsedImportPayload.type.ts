import type { ExportPayload } from './exportPayload.type';
import type { ImportedLabel } from './importedLabel.type';
import type { ImportedWord } from './importedWord.type';

export interface ParsedImportPayload {
  valid: boolean;
  words: ImportedWord[];
  folders: ImportedLabel[];
  tags: ImportedLabel[];
  settings: Partial<NonNullable<ExportPayload['settings']>> | null;
}

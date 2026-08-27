import type { ContractionRule } from './contractionRule.type';

export interface StudyLanguageProfile {
  name: string;
  speechLang: string;
  databaseName: string;
  verbParticles: ReadonlySet<string>;
  lexicalPrefix: RegExp | null;
  duplicatePrefix: RegExp | null;
  contractions: readonly ContractionRule[];
}

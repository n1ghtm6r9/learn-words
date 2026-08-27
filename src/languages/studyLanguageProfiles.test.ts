import { describe, expect, it } from 'vitest';
import { STUDY_LANGUAGE_PROFILES } from './studyLanguageProfiles';
import { STUDY_LANGUAGES } from './studyLanguages';

describe('study language profiles', () => {
  it('describes every language the app can study', () => {
    expect(STUDY_LANGUAGES).toEqual(['en', 'es']);

    for (const language of STUDY_LANGUAGES) {
      const profile = STUDY_LANGUAGE_PROFILES[language];
      expect(profile.name).not.toBe('');
      expect(profile.speechLang).not.toBe('');
      expect(profile.databaseName).not.toBe('');
      expect(profile.verbParticles.size).toBeGreaterThan(0);
    }
  });

  it('keeps English on the original database name so existing dictionaries stay in place', () => {
    expect(STUDY_LANGUAGE_PROFILES.en.databaseName).toBe('vocab-db');
  });

  it('never lets two languages share a database or a voice', () => {
    const databases = STUDY_LANGUAGES.map((language) => STUDY_LANGUAGE_PROFILES[language].databaseName);
    const voices = STUDY_LANGUAGES.map((language) => STUDY_LANGUAGE_PROFILES[language].speechLang);

    expect(new Set(databases).size).toBe(databases.length);
    expect(new Set(voices).size).toBe(voices.length);
  });
});

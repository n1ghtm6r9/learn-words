import { describe, expect, it } from 'vitest';
import { parseWordLines } from '@/lib/parseWordLines';
import { TRANSLATIONS } from './translations';
import { UI_LANGUAGES } from './uiLanguages';
import type { StudyLanguage } from '@/languages/studyLanguage.type';

const STUDIED = ['en', 'es'] as StudyLanguage[];

const FIRST_TERM: Record<StudyLanguage, string> = { en: 'hello', es: 'hola' };

describe('bulk-add placeholder', () => {
  it('puts the studied word where parseWordLines expects the term', () => {
    for (const ui of UI_LANGUAGES) {
      for (const studied of STUDIED) {
        const { valid, invalidLines } = parseWordLines(TRANSLATIONS[ui].wordListPlaceholder(studied));

        expect(invalidLines).toEqual([]);
        expect(valid[0].term).toBe(FIRST_TERM[studied]);
      }
    }
  });
});

describe('translation bundles', () => {
  it('covers every interface language with the same set of keys', () => {
    const reference = Object.keys(TRANSLATIONS.ru).sort();

    for (const language of UI_LANGUAGES) {
      expect(Object.keys(TRANSLATIONS[language]).sort()).toEqual(reference);
    }
  });

  it('names each language in that language itself', () => {
    expect(TRANSLATIONS.ru.languageName).toBe('Русский');
    expect(TRANSLATIONS.en.languageName).toBe('English');
  });
});

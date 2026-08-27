import { describe, expect, it } from 'vitest';
import { parseWordLines } from './parseWordLines';
import { TRANSLATIONS } from './translations';
import type { Language } from '@/store/language.type';
import type { StudyLanguage } from '@/languages/studyLanguage.type';

const UI_LANGUAGES = Object.keys(TRANSLATIONS) as Language[];
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

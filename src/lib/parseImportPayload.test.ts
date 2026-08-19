import { describe, expect, it } from 'vitest';
import { parseImportPayload } from './parseImportPayload';

describe('parseImportPayload', () => {
  it('reports invalid for text that is not valid JSON', () => {
    const result = parseImportPayload('not json{{{');

    expect(result).toEqual({ valid: false, words: [], settings: null });
  });

  it('reports invalid for JSON whose top level is not a plain object', () => {
    expect(parseImportPayload('42').valid).toBe(false);
    expect(parseImportPayload('"hello"').valid).toBe(false);
    expect(parseImportPayload('null').valid).toBe(false);
    expect(parseImportPayload('[1,2,3]').valid).toBe(false);
  });

  it('is valid for an empty object with no words or settings', () => {
    const result = parseImportPayload('{}');

    expect(result.valid).toBe(true);
    expect(result.words).toEqual([]);
    expect(result.settings).toBeNull();
  });

  it('keeps only word entries with a non-empty string term and translation', () => {
    const json = JSON.stringify({
      words: [
        { term: 'cat', translation: 'кот' },
        { term: '', translation: 'кот' },
        { term: 'dog', translation: '' },
        { term: '   ', translation: 'кот' },
        { term: 123, translation: 'кот' },
        { translation: 'кот' },
        'not an object',
        null,
        { term: 'bird', translation: 'птица' },
      ],
    });

    const result = parseImportPayload(json);

    expect(result.valid).toBe(true);
    expect(result.words).toEqual([
      { term: 'cat', translation: 'кот' },
      { term: 'bird', translation: 'птица' },
    ]);
  });

  it('passes through extra Word fields on valid entries without validating them', () => {
    const json = JSON.stringify({
      words: [{ term: 'cat', translation: 'кот', stage: 'review', rating: 999, bogus: true }],
    });

    const result = parseImportPayload(json);

    expect(result.words).toEqual([{ term: 'cat', translation: 'кот', stage: 'review', rating: 999, bogus: true }]);
  });

  it('treats a missing or non-array words field as an empty list', () => {
    expect(parseImportPayload('{"words": "nope"}').words).toEqual([]);
    expect(parseImportPayload('{}').words).toEqual([]);
  });

  it('validates settings field by field and drops only the invalid fields', () => {
    const json = JSON.stringify({
      settings: {
        theme: 'dark',
        accentColor: 'not-a-color',
        language: 'en',
        phaseARepeats: 3,
        phaseBRepeats: 999,
      },
    });

    const result = parseImportPayload(json);

    expect(result.settings).toEqual({ theme: 'dark', language: 'en', phaseARepeats: 3 });
  });

  it('treats settings as absent when every field is invalid', () => {
    const json = JSON.stringify({
      settings: { theme: 'purple', accentColor: 'nope', language: 'de', phaseARepeats: -1, phaseBRepeats: 'abc' },
    });

    const result = parseImportPayload(json);

    expect(result.settings).toBeNull();
  });

  it('treats a missing settings field as null', () => {
    expect(parseImportPayload('{}').settings).toBeNull();
  });

  it('treats a non-object settings field as null', () => {
    expect(parseImportPayload('{"settings": "nope"}').settings).toBeNull();
  });
});

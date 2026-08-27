import { describe, expect, it } from 'vitest';
import { detectWordKind } from './detectWordKind';

describe('detectWordKind', () => {
  it('recognizes a single word', () => {
    expect(detectWordKind('apple')).toBe('word');
  });

  it('recognizes a hyphenated compound word as a word', () => {
    expect(detectWordKind('well-known')).toBe('word');
  });

  it('recognizes a phrasal verb as a word, not a phrase', () => {
    expect(detectWordKind('give up')).toBe('word');
    expect(detectWordKind('look after')).toBe('word');
    expect(detectWordKind('turn on')).toBe('word');
    expect(detectWordKind('wake up')).toBe('word');
  });

  it('recognizes a phrasal verb regardless of particle case', () => {
    expect(detectWordKind('Give Up')).toBe('word');
  });

  it('recognizes a two-word combination that is not a phrasal verb as a phrase', () => {
    expect(detectWordKind('New York')).toBe('phrase');
    expect(detectWordKind('good morning')).toBe('phrase');
  });

  it('recognizes a multi-word combination as a phrase', () => {
    expect(detectWordKind('as soon as possible')).toBe('phrase');
  });

  it('recognizes a three-word phrasal-prepositional verb as a phrase', () => {
    expect(detectWordKind('look forward to')).toBe('phrase');
  });

  it('ignores extra whitespace around and between words', () => {
    expect(detectWordKind('  apple  ')).toBe('word');
    expect(detectWordKind('give    up')).toBe('word');
    expect(detectWordKind('good    morning')).toBe('phrase');
  });

  it('recognizes a Spanish verb with its preposition as a word', () => {
    expect(detectWordKind('acordarse de', 'es')).toBe('word');
    expect(detectWordKind('soñar con', 'es')).toBe('word');
    expect(detectWordKind('pensar en', 'es')).toBe('word');
  });

  it('recognizes a Spanish two-word expression as a phrase', () => {
    expect(detectWordKind('por favor', 'es')).toBe('phrase');
    expect(detectWordKind('de nada', 'es')).toBe('phrase');
    expect(detectWordKind('buenos días', 'es')).toBe('phrase');
  });

  it('applies the particles of the studied language, not of the other one', () => {
    expect(detectWordKind('pensar en', 'en')).toBe('phrase');
    expect(detectWordKind('give up', 'es')).toBe('phrase');
  });

  it('classifies a verb the same way with and without the infinitive marker', () => {
    expect(detectWordKind('to eat')).toBe('word');
    expect(detectWordKind('to give up')).toBe('word');
    expect(detectWordKind('To Laugh')).toBe('word');
  });

  it('recognizes a Spanish noun carrying its article as a word', () => {
    expect(detectWordKind('la casa', 'es')).toBe('word');
    expect(detectWordKind('el perro', 'es')).toBe('word');
    expect(detectWordKind('una mesa', 'es')).toBe('word');
  });

  it('still treats a longer Spanish expression as a phrase despite the article', () => {
    expect(detectWordKind('la semana pasada', 'es')).toBe('phrase');
  });

  it('keeps a bare article usable as a term of its own', () => {
    expect(detectWordKind('la', 'es')).toBe('word');
    expect(detectWordKind('to')).toBe('word');
  });

  it('recognizes an English noun carrying its article as a word', () => {
    expect(detectWordKind('a car')).toBe('word');
    expect(detectWordKind('an apple')).toBe('word');
    expect(detectWordKind('the sun')).toBe('word');
  });

  it('still reads a quantifier that needs its article as a phrase', () => {
    expect(detectWordKind('a few')).toBe('phrase');
    expect(detectWordKind('a lot')).toBe('phrase');
  });
});

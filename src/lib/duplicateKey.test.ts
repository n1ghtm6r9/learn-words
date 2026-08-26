import { describe, expect, it } from 'vitest';
import { detectWordKind } from './detectWordKind';
import { duplicateKey } from './duplicateKey';

describe('duplicateKey', () => {
  it('treats a verb with and without the infinitive marker as the same word', () => {
    expect(duplicateKey('to laugh')).toBe(duplicateKey('laugh'));
    expect(duplicateKey('To Laugh')).toBe(duplicateKey('LAUGH'));
  });

  it('does the same for phrasal verbs', () => {
    expect(duplicateKey('to give up')).toBe(duplicateKey('give up'));
  });

  it('ignores case, padding and invisible characters, as the rest of the app does', () => {
    expect(duplicateKey('  To   Laugh  ')).toBe(duplicateKey('laugh'));
    expect(duplicateKey('to laugh​')).toBe(duplicateKey('laugh'));
  });

  it('keeps the bare word "to" usable as a term of its own', () => {
    expect(duplicateKey('to')).toBe('to');
    expect(duplicateKey('to')).not.toBe(duplicateKey('laugh'));
  });

  it('does not merge unrelated words that merely start with the same letters', () => {
    expect(duplicateKey('together')).not.toBe(duplicateKey('gether'));
    expect(duplicateKey('tomorrow')).toBe('tomorrow');
  });

  it('only strips the marker at the start, never inside a phrase', () => {
    expect(duplicateKey('hard to please')).toBe('hard to please');
    expect(duplicateKey('hard to please')).not.toBe(duplicateKey('hard please'));
    expect(duplicateKey('nice to meet you')).not.toBe(duplicateKey('nice meet you'));
  });

  it('keeps different words apart', () => {
    expect(duplicateKey('to laugh')).not.toBe(duplicateKey('to cry'));
  });

  it('leaves Spanish terms alone, since Spanish infinitives carry no marker', () => {
    expect(duplicateKey('hablar', 'es')).toBe('hablar');
    expect(duplicateKey('  Hablar  ', 'es')).toBe('hablar');
  });

  it('keeps Spanish nouns apart when only the article differs', () => {
    expect(duplicateKey('el capital', 'es')).not.toBe(duplicateKey('la capital', 'es'));
  });

  it('agrees with detectWordKind about what the infinitive marker means', () => {
    expect(duplicateKey('to eat')).toBe(duplicateKey('eat'));
    expect(detectWordKind('to eat')).toBe(detectWordKind('eat'));
    expect(detectWordKind('to give up')).toBe(detectWordKind('give up'));
  });
});

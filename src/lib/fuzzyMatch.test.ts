import { describe, expect, it } from 'vitest';
import { matchAccuracy, matchAnswer } from './fuzzyMatch';

describe('matchAnswer', () => {
  it('exact match — correct', () => {
    expect(matchAnswer('привет', 'привет')).toBe('correct');
  });

  it('case and surrounding whitespace do not affect the result', () => {
    expect(matchAnswer('  Привет  ', 'привет')).toBe('correct');
  });

  it('one typo in a short word — almost', () => {
    expect(matchAnswer('кот', 'код')).toBe('almost');
  });

  it('one typo in a long word — almost', () => {
    expect(matchAnswer('путешествие', 'путешествия')).toBe('almost');
  });

  it('two typos in one word — wrong', () => {
    expect(matchAnswer('пцтешествие', 'путешествия')).toBe('wrong');
  });

  it('completely different word — wrong', () => {
    expect(matchAnswer('собака', 'кот')).toBe('wrong');
  });

  it('empty input — wrong', () => {
    expect(matchAnswer('', 'привет')).toBe('wrong');
  });

  it('a one-letter typo in one word of a phrase — almost', () => {
    expect(matchAnswer('good morming', 'good morning')).toBe('almost');
  });

  it('typos in two different words of a phrase — wrong', () => {
    expect(matchAnswer('goad morming', 'good morning')).toBe('wrong');
  });

  it('a missing word in a phrase — wrong', () => {
    expect(matchAnswer('good', 'good morning')).toBe('wrong');
  });

  it('an extra word in a phrase — wrong', () => {
    expect(matchAnswer('good morning today', 'good morning')).toBe('wrong');
  });

  it('a single missing space counts as one character wrong, not a gross error', () => {
    expect(matchAnswer('giveup', 'give up')).toBe('almost');
  });

  it('a single extra space counts as one character wrong', () => {
    expect(matchAnswer('give  up', 'give up')).toBe('almost');
  });

  it('a missing space plus a typo is still a gross error', () => {
    expect(matchAnswer('giveap', 'give up')).toBe('wrong');
  });

  it('an NFD-normalized expected term still matches an NFC-typed answer — correct', () => {
    const nfd = 'ёлка'.normalize('NFD');
    expect(matchAnswer('ёлка', nfd)).toBe('correct');
  });

  it('accepts the written-out form of a contracted term', () => {
    expect(matchAnswer('that is why', "that's why")).toBe('correct');
    expect(matchAnswer('do not', "don't")).toBe('correct');
    expect(matchAnswer('I am', "i'm")).toBe('correct');
  });

  it('accepts the contracted form of a written-out term', () => {
    expect(matchAnswer("that's why", 'that is why')).toBe('correct');
    expect(matchAnswer("can't", 'cannot')).toBe('correct');
    expect(matchAnswer("can't", 'can not')).toBe('correct');
  });

  it('accepts either reading of an ambiguous contraction', () => {
    expect(matchAnswer('he is gone', "he's gone")).toBe('correct');
    expect(matchAnswer('he has gone', "he's gone")).toBe('correct');
  });

  it('accepts a curly apostrophe where the term has a straight one', () => {
    expect(matchAnswer('don\u2019t', "don't")).toBe('correct');
  });

  it('accepts either way of negating an auxiliary', () => {
    expect(matchAnswer("he's not here", 'he is not here')).toBe('correct');
    expect(matchAnswer("he isn't here", "he's not here")).toBe('correct');
  });

  it('accepts the contractions of the language being studied', () => {
    expect(matchAnswer('a el parque', 'al parque', 'es')).toBe('correct');
    expect(matchAnswer('del coche', 'de el coche', 'es')).toBe('correct');
  });

  it('does not apply one language contractions to another', () => {
    expect(matchAnswer('do not', "don't", 'es')).not.toBe('correct');
  });

  it('accepts a noun with or without its article', () => {
    expect(matchAnswer('car', 'a car')).toBe('correct');
    expect(matchAnswer('a car', 'car')).toBe('correct');
    expect(matchAnswer('apple', 'an apple')).toBe('correct');
    expect(matchAnswer('laugh', 'to laugh')).toBe('correct');
  });

  it('holds the learner to the article when it changes the meaning', () => {
    expect(matchAnswer('few', 'a few')).toBe('wrong');
    expect(matchAnswer('little', 'a little')).toBe('wrong');
  });

  it('keeps the Spanish article, since dropping it would lose the gender', () => {
    expect(matchAnswer('la capital', 'el capital', 'es')).toBe('wrong');
  });

  it('does not let contraction hide a genuinely different answer', () => {
    expect(matchAnswer('that is when', "that's why")).toBe('wrong');
    expect(matchAnswer('do not go', "don't stop")).toBe('wrong');
  });

  it('keeps the usual typo tolerance around a contractable phrase', () => {
    expect(matchAnswer('do nol go', 'do not go')).toBe('almost');
    expect(matchAnswer('the dogs tail', "the dog's tail")).toBe('almost');
  });

  it('a trailing punctuation mark on the stored term does not block a correct answer', () => {
    expect(matchAnswer('etc', 'etc.')).toBe('correct');
  });
});

describe('matchAccuracy', () => {
  it('exact match — 1', () => {
    expect(matchAccuracy('cat', 'cat')).toBe(1);
  });

  it('one-letter typo — scaled by word length', () => {
    expect(matchAccuracy('cot', 'cat')).toBeCloseTo(2 / 3, 5);
  });

  it('completely different word of the same length — 0', () => {
    expect(matchAccuracy('dog', 'cat')).toBe(0);
  });

  it('empty input — 0', () => {
    expect(matchAccuracy('', 'cat')).toBe(0);
  });

  it('never goes negative for input much longer than expected', () => {
    expect(matchAccuracy('catcatcatcat', 'cat')).toBe(0);
  });

  it('a one-letter typo in a long phrase costs proportionally less than in a short word', () => {
    const shortWord = matchAccuracy('cot', 'cat');
    const longPhrase = matchAccuracy('good morming', 'good morning');
    expect(longPhrase).toBeGreaterThan(shortWord);
  });

  it('case and whitespace normalization do not affect accuracy', () => {
    expect(matchAccuracy('  CAT  ', 'cat')).toBe(1);
  });
  it('scores a written-out answer to a contracted term as a full match', () => {
    expect(matchAccuracy('that is why', "that's why")).toBe(1);
    expect(matchAccuracy("don't", 'do not')).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { contract } from './contract';

describe('contract', () => {
  it('collapses an auxiliary onto the word before it', () => {
    expect(contract('that is why', 'en')).toBe("that's why");
    expect(contract('we will see', 'en')).toBe("we'll see");
    expect(contract('they are here', 'en')).toBe("they're here");
    expect(contract('i am late', 'en')).toBe("i'm late");
  });

  it('collapses a negation onto its auxiliary', () => {
    expect(contract('do not', 'en')).toBe("don't");
    expect(contract('is not', 'en')).toBe("isn't");
    expect(contract('would not', 'en')).toBe("wouldn't");
    expect(contract('will not', 'en')).toBe("won't");
  });

  it('treats every spelling of cannot the same way', () => {
    expect(contract('cannot', 'en')).toBe("can't");
    expect(contract('can not', 'en')).toBe("can't");
  });

  it('sends the two ways of negating an auxiliary to one spelling', () => {
    expect(contract("he's not", 'en')).toBe(contract('he is not', 'en'));
    expect(contract("they're not", 'en')).toBe(contract('they are not', 'en'));
  });

  it('sends both readings of an ambiguous form to one spelling', () => {
    expect(contract('he is gone', 'en')).toBe(contract('he has gone', 'en'));
    expect(contract('she would go', 'en')).toBe(contract('she had go', 'en'));
  });

  it('leaves a term that has nothing to contract untouched', () => {
    expect(contract('give up', 'en')).toBe('give up');
    expect(contract("the dog's tail", 'en')).toBe("the dog's tail");
  });

  it('leaves an already contracted term untouched', () => {
    expect(contract("that's why", 'en')).toBe("that's why");
    expect(contract("don't", 'en')).toBe("don't");
  });

  it('applies the contractions of the language being studied', () => {
    expect(contract('a el parque', 'es')).toBe('al parque');
    expect(contract('de el coche', 'es')).toBe('del coche');
    expect(contract('la casa', 'es')).toBe('la casa');
  });

  it('leaves the Spanish pronoun alone, since only the article contracts', () => {
    expect(contract('de él', 'es')).toBe('de él');
  });

  it('does not apply one language rules to another', () => {
    expect(contract('do not', 'es')).toBe('do not');
    expect(contract('de el coche', 'en')).toBe('de el coche');
  });
});

import { describe, expect, it } from 'vitest';
import { seedStabilityFromLegacyRating } from './seedStabilityFromLegacyRating';
import { MAX_STABILITY_DAYS, MIN_STABILITY_DAYS } from './memoryParams';

describe('seedStabilityFromLegacyRating', () => {
  it('trusts a word the old model rated highly with a longer first interval', () => {
    const known = seedStabilityFromLegacyRating(100, 0, 'apple');
    const shaky = seedStabilityFromLegacyRating(20, 0, 'apple');

    expect(known).toBeGreaterThan(shaky);
  });

  it('credits words that had already survived several reviews', () => {
    const reviewed = seedStabilityFromLegacyRating(80, 6, 'apple');
    const untested = seedStabilityFromLegacyRating(80, 0, 'apple');

    expect(reviewed).toBeGreaterThan(untested);
  });

  it('spreads a bulk import across days instead of dumping it all on one', () => {
    const seeded = new Set(
      Array.from({ length: 200 }, (_, i) => seedStabilityFromLegacyRating(100, 0, `word-${i}`)),
    );

    expect(seeded.size).toBeGreaterThan(5);
  });

  it('gives the same word the same interval every time it is imported', () => {
    expect(seedStabilityFromLegacyRating(70, 2, 'stable')).toBe(
      seedStabilityFromLegacyRating(70, 2, 'stable'),
    );
  });

  it('keeps a corrupt rating inside the usable range', () => {
    expect(seedStabilityFromLegacyRating(-999, 0, 'a')).toBeGreaterThanOrEqual(MIN_STABILITY_DAYS);
    expect(seedStabilityFromLegacyRating(1e9, 1e9, 'b')).toBeLessThanOrEqual(MAX_STABILITY_DAYS);
  });

  it('treats an impossible rating as a perfect one rather than extrapolating past it', () => {
    expect(seedStabilityFromLegacyRating(10_000, 0, 'same')).toBe(
      seedStabilityFromLegacyRating(100, 0, 'same'),
    );
  });

  it('does not let a legacy streak push a word out of reach', () => {
    const seeded = Array.from({ length: 300 }, (_, i) =>
      seedStabilityFromLegacyRating(100, 60, `word-${i}`),
    );

    expect(Math.max(...seeded)).toBeLessThan(60);
  });
});

import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { APP_VERSION } from './appVersion';

describe('APP_VERSION', () => {
  it('is the version the package is released under', () => {
    expect(APP_VERSION).toBe(packageJson.version);
  });

  it('reads as a version number rather than an unreplaced build placeholder', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});

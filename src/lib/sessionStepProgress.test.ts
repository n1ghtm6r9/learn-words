import { describe, expect, it } from 'vitest';
import { sessionStepProgress } from './sessionStepProgress';

const word = (learningPhase: 'A' | 'B', phaseStreak: number) => ({ learningPhase, phaseStreak });

describe('sessionStepProgress', () => {
  it('starts at zero for a fresh pool', () => {
    expect(sessionStepProgress([word('A', 0), word('A', 0)], 0, 3, 3)).toEqual({ done: 0, total: 12 });
  });

  it('counts every correct step, not only graduated words', () => {
    expect(sessionStepProgress([word('A', 2), word('A', 0)], 0, 3, 3)).toEqual({ done: 2, total: 12 });
  });

  it('counts the whole recognition phase once a word reaches recall', () => {
    expect(sessionStepProgress([word('B', 1)], 0, 3, 3)).toEqual({ done: 4, total: 6 });
  });

  it('counts graduated words as fully done', () => {
    expect(sessionStepProgress([word('A', 0)], 2, 3, 3)).toEqual({ done: 12, total: 18 });
  });

  it('never lets a streak exceed its phase length', () => {
    expect(sessionStepProgress([word('A', 9)], 0, 3, 2)).toEqual({ done: 3, total: 5 });
  });
});

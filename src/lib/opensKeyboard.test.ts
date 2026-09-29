import { describe, expect, it } from 'vitest';
import { opensKeyboard } from './opensKeyboard';

function input(type: string, attributes: { readOnly?: boolean; disabled?: boolean } = {}): HTMLInputElement {
  return Object.assign(document.createElement('input'), { type, ...attributes });
}

describe('opensKeyboard', () => {
  it('is true for fields the learner types into', () => {
    expect(opensKeyboard(input('text'))).toBe(true);
    expect(opensKeyboard(input('search'))).toBe(true);
    expect(opensKeyboard(input('email'))).toBe(true);
    expect(opensKeyboard(document.createElement('textarea'))).toBe(true);
  });

  it('is false for controls without a keyboard', () => {
    expect(opensKeyboard(input('checkbox'))).toBe(false);
    expect(opensKeyboard(input('range'))).toBe(false);
    expect(opensKeyboard(document.createElement('button'))).toBe(false);
    expect(opensKeyboard(document.body)).toBe(false);
    expect(opensKeyboard(null)).toBe(false);
  });

  it('is false for fields that cannot be edited', () => {
    expect(opensKeyboard(input('text', { readOnly: true }))).toBe(false);
    expect(opensKeyboard(input('text', { disabled: true }))).toBe(false);
  });
});

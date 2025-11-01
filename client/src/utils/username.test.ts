import { describe, it, expect } from 'vitest';
import { isValidUsername } from './username';

describe('username validation', () => {
  it('accepts valid', () => {
    expect(isValidUsername('abc')).toBe(true);
    expect(isValidUsername('A_1')).toBe(true);
    expect(isValidUsername('User1234')).toBe(true);
  });
  it('rejects invalid', () => {
    expect(isValidUsername('')).toBe(false);
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('me lai!')).toBe(false);
    expect(isValidUsername('中文')).toBe(false);
    expect(isValidUsername('a'.repeat(17))).toBe(false);
  });
});

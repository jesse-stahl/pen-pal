import { normalizeUsername, isValidUsername } from '../username';

test('normalizes to lowercase and trims', () => {
  expect(normalizeUsername('  JesseS  ')).toBe('jesses');
});

describe('isValidUsername', () => {
  test('accepts 3-20 lowercase letters/numbers/underscore', () => {
    expect(isValidUsername('jesse_99')).toBe(true);
    expect(isValidUsername('abc')).toBe(true);
  });
  test('rejects too short / too long', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('a'.repeat(21))).toBe(false);
  });
  test('rejects spaces and symbols', () => {
    expect(isValidUsername('jesse stahl')).toBe(false);
    expect(isValidUsername('jesse!')).toBe(false);
  });
});

import { LANGUAGES, getLanguageName, isSupported } from '../languages';

test('includes Thai and English', () => {
  expect(isSupported('th')).toBe(true);
  expect(isSupported('en')).toBe(true);
});

test('maps code to display name', () => {
  expect(getLanguageName('th')).toBe('Thai');
  expect(getLanguageName('en')).toBe('English');
});

test('unknown code is not supported and falls back to the code', () => {
  expect(isSupported('zz')).toBe(false);
  expect(getLanguageName('zz')).toBe('zz');
});

test('language list is non-empty and unique', () => {
  const codes = LANGUAGES.map((l) => l.code);
  expect(codes.length).toBeGreaterThan(10);
  expect(new Set(codes).size).toBe(codes.length);
});

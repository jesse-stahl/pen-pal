import { buildPromptAnswer, buildDisplayPair, orientLanguages } from '../direction';

const terms = { th: 'หมา', en: 'dog' };

describe('buildDisplayPair', () => {
  const pair = { en: 'hello', th: 'สวัสดี' };

  test('native on top, target gets audio, for a Thai native', () => {
    expect(buildDisplayPair(pair, 'th', 'en')).toEqual({
      nativeTerm: 'สวัสดี',
      targetTerm: 'hello',
      audioTerm: 'hello',
      audioLang: 'en',
    });
  });

  test('native on top for an English native', () => {
    expect(buildDisplayPair(pair, 'en', 'th')).toEqual({
      nativeTerm: 'hello',
      targetTerm: 'สวัสดี',
      audioTerm: 'สวัสดี',
      audioLang: 'th',
    });
  });

  test('returns null when the viewer-language pair is missing', () => {
    expect(buildDisplayPair({ es: 'hola' }, 'th', 'en')).toBeNull();
  });
});

test('English learner is prompted in native (their own lang) and recalls target', () => {
  // user native en, target th -> shown English, must recall Thai
  expect(buildPromptAnswer(terms, 'en', 'th')).toEqual({ prompt: 'dog', answer: 'หมา' });
});

test('Thai learner is shown Thai, recalls English', () => {
  expect(buildPromptAnswer(terms, 'th', 'en')).toEqual({ prompt: 'หมา', answer: 'dog' });
});

test('returns null if either side is missing', () => {
  expect(buildPromptAnswer({ en: 'dog' }, 'en', 'th')).toBeNull();
});

describe('orientLanguages', () => {
  test("viewer's native language becomes nativeLang", () => {
    expect(orientLanguages('en', 'th', 'th')).toEqual({ nativeLang: 'th', targetLang: 'en' });
    expect(orientLanguages('en', 'th', 'en')).toEqual({ nativeLang: 'en', targetLang: 'th' });
  });

  test('falls back to langA as native when the viewer speaks neither', () => {
    expect(orientLanguages('en', 'th', 'es')).toEqual({ nativeLang: 'en', targetLang: 'th' });
  });
});

import { buildPromptAnswer } from '../direction';

const terms = { th: 'หมา', en: 'dog' };

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

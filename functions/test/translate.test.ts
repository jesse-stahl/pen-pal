import { buildTranslateUrl, parseTranslateResponse } from '../src/translate';

test('builds the v2 endpoint url with encoded params', () => {
  const url = buildTranslateUrl({ text: 'หมา', source: 'th', target: 'en', apiKey: 'KEY' });
  expect(url).toContain('https://translation.googleapis.com/language/translate/v2');
  expect(url).toContain('key=KEY');
  expect(url).toContain('source=th');
  expect(url).toContain('target=en');
  expect(url).toContain(encodeURIComponent('หมา'));
});

test('parses translatedText out of the API response', () => {
  const body = { data: { translations: [{ translatedText: 'dog' }] } };
  expect(parseTranslateResponse(body)).toBe('dog');
});

test('throws on malformed response', () => {
  expect(() => parseTranslateResponse({ data: {} })).toThrow();
});

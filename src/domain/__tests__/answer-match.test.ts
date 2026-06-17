import { normalize, isAcceptable } from '../answer-match';

test('normalize trims, lowercases, strips punctuation and extra spaces', () => {
  expect(normalize('  The   Dog! ')).toBe('the dog');
});

test('exact match (after normalize) is acceptable', () => {
  expect(isAcceptable('dog', 'Dog')).toBe(true);
});

test('accepts a one-character typo in a short word', () => {
  expect(isAcceptable('dog', 'dgo')).toBe(true); // transposition, distance small
});

test('rejects a clearly wrong answer', () => {
  expect(isAcceptable('dog', 'cat')).toBe(false);
});

test('accepts alternative answers separated by slash or comma', () => {
  expect(isAcceptable('hello / hi', 'hi')).toBe(true);
  expect(isAcceptable('big, large', 'large')).toBe(true);
});

test('non-latin (Thai) requires exact normalized match (no fuzz)', () => {
  expect(isAcceptable('หมา', 'หมา')).toBe(true);
  expect(isAcceptable('หมา', 'หมาก')).toBe(false);
});

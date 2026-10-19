import { wrapIndex } from '../wrap-index';

test('in-range indexes are unchanged', () => {
  expect(wrapIndex(2, 5)).toBe(2);
});

test('past the end wraps to the start', () => {
  expect(wrapIndex(5, 5)).toBe(0);
});

test('before the start wraps to the end', () => {
  expect(wrapIndex(-1, 5)).toBe(4);
});

test('empty length yields 0', () => {
  expect(wrapIndex(3, 0)).toBe(0);
});

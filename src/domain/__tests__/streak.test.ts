import { applyStudyDay, StreakState } from '../streak';

const base: StreakState = { current: 3, longest: 5, lastStudyDay: '2026-06-13' };

test('studying the next day increments current streak', () => {
  const s = applyStudyDay(base, '2026-06-14');
  expect(s.current).toBe(4);
  expect(s.longest).toBe(5);
});

test('studying the same day is a no-op', () => {
  const s = applyStudyDay(base, '2026-06-13');
  expect(s.current).toBe(3);
});

test('skipping a day resets current streak to 1', () => {
  const s = applyStudyDay(base, '2026-06-15');
  expect(s.current).toBe(1);
});

test('new longest is recorded', () => {
  const s = applyStudyDay({ current: 5, longest: 5, lastStudyDay: '2026-06-13' }, '2026-06-14');
  expect(s.current).toBe(6);
  expect(s.longest).toBe(6);
});

test('first ever study day starts streak at 1', () => {
  const s = applyStudyDay({ current: 0, longest: 0, lastStudyDay: '' }, '2026-06-14');
  expect(s.current).toBe(1);
  expect(s.longest).toBe(1);
});

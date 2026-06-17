import { initialSrs, schedule, SrsState, isDue } from '../srs';
import { msFromIso } from '../clock';

const NOW = msFromIso('2026-06-14T08:00:00Z');

test('initial state is due immediately with default ease', () => {
  const s = initialSrs(NOW);
  expect(s.ease).toBeCloseTo(2.5);
  expect(s.repetitions).toBe(0);
  expect(s.intervalDays).toBe(0);
  expect(isDue(s, NOW)).toBe(true);
});

test('first correct answer (grade>=3) sets interval to 1 day', () => {
  const s = schedule(initialSrs(NOW), 4, NOW);
  expect(s.repetitions).toBe(1);
  expect(s.intervalDays).toBe(1);
});

test('second consecutive correct sets interval to 6 days', () => {
  let s = schedule(initialSrs(NOW), 4, NOW);
  s = schedule(s, 4, NOW + 86400000);
  expect(s.repetitions).toBe(2);
  expect(s.intervalDays).toBe(6);
});

test('third correct multiplies interval by ease', () => {
  let s = schedule(initialSrs(NOW), 5, NOW);
  s = schedule(s, 5, NOW);
  const before = s.intervalDays; // 6
  const easeBefore = s.ease; // SM-2 uses the pre-update ease for the next interval
  s = schedule(s, 5, NOW);
  expect(s.intervalDays).toBe(Math.round(before * easeBefore));
});

test('a wrong answer (grade<3) resets repetitions and interval to 1', () => {
  let s = schedule(initialSrs(NOW), 5, NOW);
  s = schedule(s, 5, NOW); // interval 6
  s = schedule(s, 1, NOW); // lapse
  expect(s.repetitions).toBe(0);
  expect(s.intervalDays).toBe(1);
});

test('ease never drops below 1.3', () => {
  let s = initialSrs(NOW);
  for (let i = 0; i < 20; i++) s = schedule(s, 0, NOW);
  expect(s.ease).toBeGreaterThanOrEqual(1.3);
});

test('dueAt advances by intervalDays', () => {
  const s = schedule(initialSrs(NOW), 4, NOW);
  expect(s.dueAt).toBe(NOW + 1 * 86400000);
  expect(isDue(s, NOW)).toBe(false);
  expect(isDue(s, NOW + 86400000)).toBe(true);
});

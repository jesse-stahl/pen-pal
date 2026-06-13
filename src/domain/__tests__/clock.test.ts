import { nowMs, msFromIso, dayKey, dayDiff } from '../clock';

test('msFromIso parses an ISO instant to epoch ms', () => {
  expect(msFromIso('2026-06-14T08:00:00Z')).toBe(Date.UTC(2026, 5, 14, 8, 0, 0));
});

test('nowMs returns a positive integer', () => {
  const t = nowMs();
  expect(Number.isInteger(t)).toBe(true);
  expect(t).toBeGreaterThan(0);
});

test('dayKey formats a date-only key from an ISO date', () => {
  expect(dayKey('2026-06-14')).toBe('2026-06-14');
});

test('dayDiff counts whole days between two day keys', () => {
  expect(dayDiff('2026-06-13', '2026-06-14')).toBe(1);
  expect(dayDiff('2026-06-13', '2026-06-13')).toBe(0);
  expect(dayDiff('2026-06-13', '2026-06-15')).toBe(2);
});

import { DateTime } from 'luxon';

/** Current time as epoch milliseconds. The one place "now" enters the app. */
export function nowMs(): number {
  return DateTime.now().toMillis();
}

/** Parse an ISO instant string to epoch milliseconds. */
export function msFromIso(iso: string): number {
  return DateTime.fromISO(iso, { zone: 'utc' }).toMillis();
}

/** Today's local-time day key, "yyyy-MM-dd". */
export function todayKey(): string {
  return DateTime.now().toFormat('yyyy-MM-dd');
}

/** Normalize/echo a day key ("yyyy-MM-dd"). */
export function dayKey(isoDate: string): string {
  return DateTime.fromISO(isoDate, { zone: 'utc' }).toFormat('yyyy-MM-dd');
}

/** Whole-day difference between two day keys (b - a). */
export function dayDiff(a: string, b: string): number {
  const da = DateTime.fromISO(a, { zone: 'utc' }).startOf('day');
  const db = DateTime.fromISO(b, { zone: 'utc' }).startOf('day');
  return Math.round(db.diff(da, 'days').days);
}

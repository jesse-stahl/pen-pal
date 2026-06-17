const DAY_MS = 86400000;
const MIN_EASE = 1.3;

export interface SrsState {
  ease: number;
  intervalDays: number;
  repetitions: number;
  dueAt: number;        // epoch ms
  lastGrade: number;
  lastReviewedAt: number;
}

export function initialSrs(now: number): SrsState {
  return {
    ease: 2.5,
    intervalDays: 0,
    repetitions: 0,
    dueAt: now,         // due immediately
    lastGrade: -1,
    lastReviewedAt: 0,
  };
}

export function isDue(s: SrsState, now: number): boolean {
  return s.dueAt <= now;
}

/**
 * SM-2. grade in 0..5. grade>=3 is a "correct" recall.
 */
export function schedule(prev: SrsState, grade: number, now: number): SrsState {
  const g = Math.max(0, Math.min(5, Math.round(grade)));
  let { ease, intervalDays, repetitions } = prev;

  if (g < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * ease);
  }

  // SM-2 ease update
  ease = ease + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02));
  if (ease < MIN_EASE) ease = MIN_EASE;

  return {
    ease,
    intervalDays,
    repetitions,
    dueAt: now + intervalDays * DAY_MS,
    lastGrade: g,
    lastReviewedAt: now,
  };
}

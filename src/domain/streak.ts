import { dayDiff } from './clock';

export interface StreakState {
  current: number;
  longest: number;
  lastStudyDay: string; // "yyyy-MM-dd"
}

export function applyStudyDay(prev: StreakState, today: string): StreakState {
  if (!prev.lastStudyDay) {
    return { current: 1, longest: Math.max(1, prev.longest), lastStudyDay: today };
  }
  const diff = dayDiff(prev.lastStudyDay, today);
  if (diff === 0) return prev;
  const current = diff === 1 ? prev.current + 1 : 1;
  return {
    current,
    longest: Math.max(prev.longest, current),
    lastStudyDay: today,
  };
}

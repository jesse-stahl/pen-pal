import { learnerLevel, weeklyActivity, deriveAchievements } from '../progress-stats';
import { StreakState } from '../../firebase/schema';

test('learnerLevel derives level + progress from words known', () => {
  // 10 words per level; level is 1-based
  expect(learnerLevel(0)).toEqual({ level: 1, into: 0, needed: 10, progress: 0 });
  const l = learnerLevel(25);
  expect(l.level).toBe(3);
  expect(l.into).toBe(5);
  expect(l.needed).toBe(10);
  expect(l.progress).toBe(50);
});

test('weeklyActivity marks the current streak run ending on lastStudyDay', () => {
  const streak: StreakState = { current: 3, longest: 5, lastStudyDay: '2026-06-17' };
  // last 7 days ending today (2026-06-17): indices 0..6, index 6 = today
  const week = weeklyActivity(streak, '2026-06-17');
  expect(week).toEqual([false, false, false, false, true, true, true]);
});

test('weeklyActivity is all-false when no study has happened', () => {
  const streak: StreakState = { current: 0, longest: 0, lastStudyDay: '' };
  expect(weeklyActivity(streak, '2026-06-17')).toEqual([
    false, false, false, false, false, false, false,
  ]);
});

test('deriveAchievements unlocks based on real milestones', () => {
  const streak: StreakState = { current: 8, longest: 8, lastStudyDay: '2026-06-17' };
  const a = deriveAchievements({ streak, knownCount: 60, tradeCount: 1, listCount: 2 });
  const byId = Object.fromEntries(a.map((x) => [x.id, x.unlocked]));
  expect(byId['first-word']).toBe(true); // knownCount > 0
  expect(byId['week-streak']).toBe(true); // longest >= 7
  expect(byId['fifty-words']).toBe(true); // knownCount >= 50
  expect(byId['first-trade']).toBe(true); // tradeCount > 0
  expect(byId['century']).toBe(false); // knownCount < 100
});

import { DateTime } from 'luxon';
import { StreakState } from '../firebase/schema';

const WORDS_PER_LEVEL = 10;

export interface LevelInfo {
  level: number; // 1-based
  into: number; // words into the current level
  needed: number; // words per level
  progress: number; // 0..100 toward next level
}

export function learnerLevel(knownCount: number): LevelInfo {
  const level = Math.floor(knownCount / WORDS_PER_LEVEL) + 1;
  const into = knownCount % WORDS_PER_LEVEL;
  const progress = Math.round((into / WORDS_PER_LEVEL) * 100);
  return { level, into, needed: WORDS_PER_LEVEL, progress };
}

/** 7 booleans for the last 7 days ending on `today` (index 6 = today). */
export function weeklyActivity(streak: StreakState, today: string): boolean[] {
  const end = DateTime.fromISO(today).startOf('day');
  const last = streak.lastStudyDay
    ? DateTime.fromISO(streak.lastStudyDay).startOf('day')
    : null;
  const start = last ? last.minus({ days: Math.max(0, streak.current - 1) }) : null;

  const out: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = end.minus({ days: i });
    const active = !!(last && start && day >= start && day <= last);
    out.push(active);
  }
  return out;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface AchievementInput {
  streak: StreakState;
  knownCount: number;
  tradeCount: number;
  listCount: number;
}

export function deriveAchievements(input: AchievementInput): Achievement[] {
  const { streak, knownCount, tradeCount, listCount } = input;
  return [
    {
      id: 'first-word',
      title: 'First Word',
      description: 'Start learning your first word',
      unlocked: knownCount > 0,
    },
    {
      id: 'first-list',
      title: 'Collector',
      description: 'Create your first list',
      unlocked: listCount > 0,
    },
    {
      id: 'first-trade',
      title: 'Pen Pals',
      description: 'Trade a word with a partner',
      unlocked: tradeCount > 0,
    },
    {
      id: 'week-streak',
      title: 'On Fire',
      description: 'Reach a 7-day streak',
      unlocked: streak.longest >= 7,
    },
    {
      id: 'fifty-words',
      title: 'Half Century',
      description: 'Learn 50 words',
      unlocked: knownCount >= 50,
    },
    {
      id: 'century',
      title: 'Centurion',
      description: 'Learn 100 words',
      unlocked: knownCount >= 100,
    },
  ];
}
